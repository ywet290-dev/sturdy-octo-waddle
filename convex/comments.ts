import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createComment = mutation({
  args: {
    text: v.string(),
    postId: v.id("posts"),
    authorId: v.string(),
    authorName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("comments", {
      ...args,
      upvotes: 0,
      downvotes: 0,
    });
  },
});

export const getCommentsForPost = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    return await ctx.db.query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
  },
});

export const upvoteComment = mutation({
  args: { id: v.id("comments") },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.id);
    if (!comment) throw new Error("Comment not found");
    await ctx.db.patch(args.id, { upvotes: comment.upvotes + 1 });
  },
});

export const downvoteComment = mutation({
  args: { id: v.id("comments") },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.id);
    if (!comment) throw new Error("Comment not found");
    await ctx.db.patch(args.id, { downvotes: comment.downvotes + 1 });
  },
});
