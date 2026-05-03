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
    return await ctx.db.query("posts").withIndex("by_upvotes").order("desc").take(10);
  },
});

export const searchPosts = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    // Basic search filtering in memory since Convex text search is setup differently,
    // but for simplicity we will filter here.
    const allPosts = await ctx.db.query("posts").order("desc").collect();
    if (!args.query) return allPosts;
    const lowerQuery = args.query.toLowerCase();
    return allPosts.filter(post => 
      post.title.toLowerCase().includes(lowerQuery) || 
      post.text.toLowerCase().includes(lowerQuery)
    );
  },
});

export const upvotePost = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post) throw new Error("Post not found");
    await ctx.db.patch(args.id, { upvotes: post.upvotes + 1 });
  },
});

export const downvotePost = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post) throw new Error("Post not found");
    await ctx.db.patch(args.id, { downvotes: post.downvotes + 1 });
  },
});
