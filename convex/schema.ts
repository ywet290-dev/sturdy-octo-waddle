import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
    parentCommentId: v.optional(v.id("comments")), // For nested replies
    authorId: v.string(),
    authorName: v.string(),
    upvotes: v.number(),
    downvotes: v.number(),
  }).index("by_post", ["postId"]),

  // Track votes per user so they can only vote once
  votes: defineTable({
    userId: v.string(),
    targetId: v.string(), // post or comment ID as string
    targetType: v.union(v.literal("post"), v.literal("comment")),
    voteType: v.union(v.literal("up"), v.literal("down")),
  })
    .index("by_user_target", ["userId", "targetId"])
    .index("by_target", ["targetId"]),
});
