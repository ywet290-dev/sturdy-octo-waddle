"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { ArrowUp, ArrowDown, MessageSquare, Send, Trash2, Pencil } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import TopBar from "@/components/TopBar";

import { PostCard } from "@/components/PostCard";

// ── Main Home Page ──
export default function HomePage() {
  const { user } = useUser();
  const posts = useQuery(api.posts.getPosts);
  const popularPosts = useQuery(api.posts.getPopularPosts);
  const userVotes = useQuery(
    api.posts.getUserVotes,
    user ? { userId: user.id } : "skip"
  );

  const userId = user?.id ?? "";
  const userName = user?.fullName || user?.username || "Anonymous";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <TopBar />

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 p-6">
        {/* Discover Section */}
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-3xl font-bold mb-6">Discover</h2>
          {posts === undefined ? (
            <div className="animate-pulse flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl"
                />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <p className="text-zinc-500">
              No posts yet. Be the first to create one!
            </p>
          ) : (
            posts.map((post: Doc<"posts">) => (
              <PostCard
                key={post._id}
                post={post}
                userId={userId}
                userName={userName}
                userImageUrl={user?.imageUrl}
                userVotes={userVotes ?? []}
              />
            ))
          )}
        </div>

        {/* Popular Help Section */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              🔥 Popular Help
            </h2>
            <div className="space-y-4">
              {popularPosts === undefined ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 bg-zinc-200 dark:bg-zinc-800 rounded-lg"
                    />
                  ))}
                </div>
              ) : popularPosts.length === 0 ? (
                <p className="text-sm text-zinc-500">No popular posts yet.</p>
              ) : (
                popularPosts.map((post: Doc<"posts">) => (
                  <div
                    key={post._id}
                    className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 pb-3 last:pb-0"
                  >
                    <h4 className="font-medium text-sm line-clamp-2 hover:text-blue-500 cursor-pointer transition-colors">
                      {post.title}
                    </h4>
                    <span className="text-xs text-zinc-500 mt-1 block">
                      {post.upvotes} upvotes
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
