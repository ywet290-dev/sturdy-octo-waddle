import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  posts: defineTable({
    title: v.string(),
    text: v.string(),
    imageId: v.optional(v.id("_storage")),
    authorId: v.string(), // Clerk user ID
    authorName: v.string(),
    upvotes: v.number(),
    downvotes: v.number(),
  }).index("by_upvotes", ["upvotes"]),
  
  comments: defineTable({
    text: v.string(),
    postId: v.id("posts"),
    authorId: v.string(),
    authorName: v.string(),
    upvotes: v.number(),
    downvotes: v.number(),
  }).index("by_post", ["postId"]),
});
