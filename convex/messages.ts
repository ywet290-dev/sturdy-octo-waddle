import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Send a private message
export const sendMessage = mutation({
  args: {
    senderId: v.string(),
    receiverId: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      senderId: args.senderId,
      receiverId: args.receiverId,
      text: args.text,
      read: false,
    });
  },
});

// Get conversation between two users (both directions)
export const getConversation = query({
  args: { userId1: v.string(), userId2: v.string() },
  handler: async (ctx, args) => {
    const sent = await ctx.db
      .query("messages")
      .withIndex("by_participants", (q) =>
        q.eq("senderId", args.userId1).eq("receiverId", args.userId2)
      )
      .collect();
    const received = await ctx.db
      .query("messages")
      .withIndex("by_participants", (q) =>
        q.eq("senderId", args.userId2).eq("receiverId", args.userId1)
      )
      .collect();

    // Merge and sort by creation time
    const all = [...sent, ...received];
    all.sort((a, b) => a._creationTime - b._creationTime);
    return all;
  },
});

// Get all conversations for a user (unique chat partners)
export const getConversations = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const allMessages = await ctx.db.query("messages").collect();
    const myMessages = allMessages.filter(
      (m) => m.senderId === args.userId || m.receiverId === args.userId
    );

    // Get unique partners
    const partnerIds = new Set<string>();
    for (const m of myMessages) {
      const partnerId =
        m.senderId === args.userId ? m.receiverId : m.senderId;
      partnerIds.add(partnerId);
    }

    // Get latest message and user info for each partner
    const conversations = [];
    for (const partnerId of partnerIds) {
      const partner = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", partnerId))
        .first();

      const partnerMessages = myMessages
        .filter(
          (m) => m.senderId === partnerId || m.receiverId === partnerId
        )
        .sort((a, b) => b._creationTime - a._creationTime);

      const unreadCount = partnerMessages.filter(
        (m) => m.receiverId === args.userId && !m.read
      ).length;

      conversations.push({
        partnerId,
        partnerName: partner?.name ?? "Unknown",
        partnerImage: partner?.profileImageUrl,
        partnerOnline: partner?.isOnline ?? false,
        lastMessage: partnerMessages[0]?.text ?? "",
        lastMessageTime: partnerMessages[0]?._creationTime ?? 0,
        unreadCount,
      });
    }

    conversations.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    return conversations;
  },
});

// Mark messages as read
export const markAsRead = mutation({
  args: { senderId: v.string(), receiverId: v.string() },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("messages")
      .withIndex("by_participants", (q) =>
        q.eq("senderId", args.senderId).eq("receiverId", args.receiverId)
      )
      .collect();

    for (const msg of unread) {
      if (!msg.read) {
        await ctx.db.patch(msg._id, { read: true });
      }
    }
  },
});
