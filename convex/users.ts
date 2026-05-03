import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const SITE_OWNER_EMAIL = "ywet290@gmail.com";

// Create or update user profile on login
export const upsertUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    profileImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
        profileImageUrl: args.profileImageUrl,
        isOnline: true,
        lastSeen: Date.now(),
        contacts: existing.contacts ?? [],
      });
      return existing._id;
    }

    // New user
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      profileImageUrl: args.profileImageUrl,
      isOnline: true,
      lastSeen: Date.now(),
      contacts: [],
    });
  },
});

// Get user by clerkId
export const getUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Search users by name
export const searchUsers = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const allUsers = await ctx.db.query("users").collect();
    if (!args.query) return allUsers.slice(0, 20);
    const lower = args.query.toLowerCase();
    return allUsers.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(lower)) ||
        (u.email && u.email.toLowerCase().includes(lower))
    );
  },
});

// Get online users
export const getOnlineUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_online", (q) => q.eq("isOnline", true))
      .collect();
  },
});

// Set user offline
export const setOffline = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (user) {
      await ctx.db.patch(user._id, { isOnline: false, lastSeen: Date.now() });
    }
  },
});

// Set user online
export const setOnline = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (user) {
      await ctx.db.patch(user._id, { isOnline: true, lastSeen: Date.now() });
    }
  },
});

// ── Contacts & Profiles ──

// Add contact
export const addContact = mutation({
  args: { myClerkId: v.string(), contactClerkId: v.string() },
  handler: async (ctx, args) => {
    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.myClerkId))
      .first();
    if (!me) throw new Error("User not found");
    const contacts = me.contacts || [];
    if (contacts.includes(args.contactClerkId)) return;
    await ctx.db.patch(me._id, {
      contacts: [...contacts, args.contactClerkId],
    });
  },
});

// Remove contact
export const removeContact = mutation({
  args: { myClerkId: v.string(), contactClerkId: v.string() },
  handler: async (ctx, args) => {
    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.myClerkId))
      .first();
    if (!me) throw new Error("User not found");
    const contacts = me.contacts || [];
    await ctx.db.patch(me._id, {
      contacts: contacts.filter((c) => c !== args.contactClerkId),
    });
  },
});

// Get contacts with user data
export const getContacts = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!me) return [];
    const contacts = [];
    const myContacts = me.contacts || [];
    for (const cId of myContacts) {
      const u = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", cId))
        .first();
      if (u) contacts.push(u);
    }
    return contacts;
  },
});

// Update profile image
export const updateProfileImage = mutation({
  args: { clerkId: v.string(), profileImageUrl: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, { profileImageUrl: args.profileImageUrl });
  },
});

