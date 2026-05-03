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
      });
      return existing._id;
    }

    // New user — check if site owner
    const role =
      args.email.toLowerCase() === SITE_OWNER_EMAIL ? "owner" : "user";

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      profileImageUrl: args.profileImageUrl,
      role,
      isBanned: false,
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
        u.name.toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower)
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

// ── Admin Functions ──

// Ban a user (owner/admin only)
export const banUser = mutation({
  args: {
    targetClerkId: v.string(),
    reason: v.string(),
    adminClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.adminClerkId))
      .first();
    if (!admin || (admin.role !== "owner" && admin.role !== "admin"))
      throw new Error("Unauthorized");

    const target = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.targetClerkId))
      .first();
    if (!target) throw new Error("User not found");

    await ctx.db.patch(target._id, { isBanned: true });
    await ctx.db.insert("bans", {
      clerkId: args.targetClerkId,
      email: target.email,
      reason: args.reason,
      bannedBy: args.adminClerkId,
    });
  },
});

// Unban a user
export const unbanUser = mutation({
  args: { targetClerkId: v.string(), adminClerkId: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.adminClerkId))
      .first();
    if (!admin || (admin.role !== "owner" && admin.role !== "admin"))
      throw new Error("Unauthorized");

    const target = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.targetClerkId))
      .first();
    if (!target) throw new Error("User not found");

    await ctx.db.patch(target._id, { isBanned: false });

    // Remove ban record
    const ban = await ctx.db
      .query("bans")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.targetClerkId))
      .first();
    if (ban) await ctx.db.delete(ban._id);
  },
});

// Ban by IP
export const banIp = mutation({
  args: {
    targetClerkId: v.string(),
    ip: v.string(),
    reason: v.string(),
    adminClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.adminClerkId))
      .first();
    if (!admin || (admin.role !== "owner" && admin.role !== "admin"))
      throw new Error("Unauthorized");

    const target = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.targetClerkId))
      .first();
    if (!target) throw new Error("User not found");

    await ctx.db.patch(target._id, { isBanned: true, bannedIp: args.ip });
    await ctx.db.insert("bans", {
      clerkId: args.targetClerkId,
      email: target.email,
      ip: args.ip,
      reason: args.reason,
      bannedBy: args.adminClerkId,
    });
  },
});

// Make admin (owner only)
export const setAdmin = mutation({
  args: { targetClerkId: v.string(), ownerClerkId: v.string() },
  handler: async (ctx, args) => {
    const owner = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.ownerClerkId))
      .first();
    if (!owner || owner.role !== "owner") throw new Error("Only owner can do this");

    const target = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.targetClerkId))
      .first();
    if (!target) throw new Error("User not found");

    await ctx.db.patch(target._id, { role: "admin" });
  },
});

// Remove admin (owner only)
export const removeAdmin = mutation({
  args: { targetClerkId: v.string(), ownerClerkId: v.string() },
  handler: async (ctx, args) => {
    const owner = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.ownerClerkId))
      .first();
    if (!owner || owner.role !== "owner") throw new Error("Only owner can do this");

    const target = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.targetClerkId))
      .first();
    if (!target) throw new Error("User not found");

    await ctx.db.patch(target._id, { role: "user" });
  },
});

// Add contact
export const addContact = mutation({
  args: { myClerkId: v.string(), contactClerkId: v.string() },
  handler: async (ctx, args) => {
    const me = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.myClerkId))
      .first();
    if (!me) throw new Error("User not found");
    if (me.contacts.includes(args.contactClerkId)) return;
    await ctx.db.patch(me._id, {
      contacts: [...me.contacts, args.contactClerkId],
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
    await ctx.db.patch(me._id, {
      contacts: me.contacts.filter((c) => c !== args.contactClerkId),
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
    for (const cId of me.contacts) {
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

// Get all banned users
export const getBannedUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("bans").collect();
  },
});
