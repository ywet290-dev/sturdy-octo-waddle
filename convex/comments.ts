import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createComment = mutation({
  args: {
    text: v.string(),
    postId: v.id("posts"),
    parentCommentId: v.optional(v.id("comments")),
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
    return await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
  },
});

// Vote on a comment — same per-user logic as posts
export const voteComment = mutation({
  args: {
    commentId: v.id("comments"),
    userId: v.string(),
    voteType: v.union(v.literal("up"), v.literal("down")),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_user_target", (q) =>
        q.eq("userId", args.userId).eq("targetId", args.commentId as string)
      )
      .first();

    if (existingVote) {
      if (existingVote.voteType === args.voteType) {
        await ctx.db.delete(existingVote._id);
        if (args.voteType === "up") {
          await ctx.db.patch(args.commentId, {
            upvotes: comment.upvotes - 1,
          });
        } else {
          await ctx.db.patch(args.commentId, {
            downvotes: comment.downvotes - 1,
          });
        }
        return "removed";
      } else {
        await ctx.db.patch(existingVote._id, { voteType: args.voteType });
        if (args.voteType === "up") {
          await ctx.db.patch(args.commentId, {
            upvotes: comment.upvotes + 1,
            downvotes: comment.downvotes - 1,
          });
        } else {
          await ctx.db.patch(args.commentId, {
            upvotes: comment.upvotes - 1,
            downvotes: comment.downvotes + 1,
          });
        }
        return "switched";
      }
    } else {
      await ctx.db.insert("votes", {
        userId: args.userId,
        targetId: args.commentId as string,
        targetType: "comment",
        voteType: args.voteType,
      });
      if (args.voteType === "up") {
        await ctx.db.patch(args.commentId, {
          upvotes: comment.upvotes + 1,
        });
      } else {
        await ctx.db.patch(args.commentId, {
          downvotes: comment.downvotes + 1,
        });
      }
      return "voted";
    }
  },
});
