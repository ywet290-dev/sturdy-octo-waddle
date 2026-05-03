import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User profiles
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    profileImageUrl: v.optional(v.string()),
    role: v.optional(v.union(v.literal("owner"), v.literal("admin"), v.literal("user"))),
    isBanned: v.optional(v.boolean()),
    bannedIp: v.optional(v.string()),
    isOnline: v.optional(v.boolean()),
    lastSeen: v.optional(v.number()),
    contacts: v.optional(v.array(v.string())), // array of clerkIds
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_online", ["isOnline"]),

  posts: defineTable({
    title: v.string(),
    text: v.string(),
    imageId: v.optional(v.id("_storage")),
    authorId: v.string(),
    authorName: v.string(),
    upvotes: v.number(),
    downvotes: v.number(),
  }).index("by_upvotes", ["upvotes"]),

  comments: defineTable({
    text: v.string(),
    postId: v.id("posts"),
    parentCommentId: v.optional(v.id("comments")),
    authorId: v.string(),
    authorName: v.string(),
    upvotes: v.number(),
    downvotes: v.number(),
  }).index("by_post", ["postId"]),

  votes: defineTable({
    userId: v.string(),
    targetId: v.string(),
    targetType: v.union(v.literal("post"), v.literal("comment")),
    voteType: v.union(v.literal("up"), v.literal("down")),
  })
    .index("by_user_target", ["userId", "targetId"])
    .index("by_target", ["targetId"]),

  // Private messages
  messages: defineTable({
    senderId: v.string(),
    receiverId: v.string(),
    text: v.string(),
    read: v.boolean(),
  }).index("by_participants", ["senderId", "receiverId"]),

  // Bans
  bans: defineTable({
    clerkId: v.string(),
    email: v.string(),
    ip: v.optional(v.string()),
    reason: v.string(),
    bannedBy: v.string(),
  }).index("by_clerkId", ["clerkId"]),
});
