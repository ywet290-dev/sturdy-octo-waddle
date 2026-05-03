import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createPost = mutation({
  args: {
    title: v.string(),
    text: v.string(),
    imageId: v.optional(v.id("_storage")),
    authorId: v.string(),
    authorName: v.string(),
  },
  handler: async (ctx, args) => {
    const postId = await ctx.db.insert("posts", {
      ...args,
      upvotes: 0,
      downvotes: 0,
    });
    return postId;
  },
});

export const getPosts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("posts").order("desc").take(50);
  },
});

export const getPopularPosts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_upvotes")
      .order("desc")
      .take(10);
  },
});

export const searchPosts = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const allPosts = await ctx.db.query("posts").order("desc").collect();
    if (!args.query) return allPosts;
    const lowerQuery = args.query.toLowerCase();
    return allPosts.filter(
      (post) =>
        post.title.toLowerCase().includes(lowerQuery) ||
        post.text.toLowerCase().includes(lowerQuery)
    );
  },
});

// Vote on a post — each user can only have 1 vote (up or down), toggleable
export const votePost = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.string(),
    voteType: v.union(v.literal("up"), v.literal("down")),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    // Check if user already voted on this post
    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_user_target", (q) =>
        q.eq("userId", args.userId).eq("targetId", args.postId as string)
      )
      .first();

    if (existingVote) {
      if (existingVote.voteType === args.voteType) {
        // Same vote again → remove the vote (toggle off)
        await ctx.db.delete(existingVote._id);
        if (args.voteType === "up") {
          await ctx.db.patch(args.postId, { upvotes: post.upvotes - 1 });
        } else {
          await ctx.db.patch(args.postId, { downvotes: post.downvotes - 1 });
        }
        return "removed";
      } else {
        // Switch vote direction
        await ctx.db.patch(existingVote._id, { voteType: args.voteType });
        if (args.voteType === "up") {
          await ctx.db.patch(args.postId, {
            upvotes: post.upvotes + 1,
            downvotes: post.downvotes - 1,
          });
        } else {
          await ctx.db.patch(args.postId, {
            upvotes: post.upvotes - 1,
            downvotes: post.downvotes + 1,
          });
        }
        return "switched";
      }
    } else {
      // New vote
      await ctx.db.insert("votes", {
        userId: args.userId,
        targetId: args.postId as string,
        targetType: "post",
        voteType: args.voteType,
      });
      if (args.voteType === "up") {
        await ctx.db.patch(args.postId, { upvotes: post.upvotes + 1 });
      } else {
        await ctx.db.patch(args.postId, { downvotes: post.downvotes + 1 });
      }
      return "voted";
    }
  },
});

// Get the current user's vote on a specific post
export const getUserVotes = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("votes")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
  },
});

// Edit a post (only the author can edit)
export const editPost = mutation({
  args: {
    postId: v.id("posts"),
    title: v.string(),
    text: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");
    if (post.authorId !== args.userId) throw new Error("Unauthorized");
    await ctx.db.patch(args.postId, { title: args.title, text: args.text });
  },
});

// Delete a post (author OR admin/owner)
export const deletePost = mutation({
  args: { postId: v.id("posts"), userId: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    // Check if user is the author or an admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
      .first();

    const isAuthor = post.authorId === args.userId;
    const isAdmin = user?.role === "owner" || user?.role === "admin";

    if (!isAuthor && !isAdmin) throw new Error("Unauthorized");

    // Delete related comments
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    for (const c of comments) {
      await ctx.db.delete(c._id);
    }

    await ctx.db.delete(args.postId);
  },
});
