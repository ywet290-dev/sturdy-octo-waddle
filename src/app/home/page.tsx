"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ArrowUp, ArrowDown, MessageSquare } from "lucide-react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function HomePage() {
  const posts = useQuery(api.posts.getPosts);
  const popularPosts = useQuery(api.posts.getPopularPosts);
  const upvote = useMutation(api.posts.upvotePost);
  const downvote = useMutation(api.posts.downvotePost);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-2xl font-bold tracking-tight">Forum App</h1>
        <div className="flex items-center gap-4">
          <Link href="/create" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            Create Post
          </Link>
          <Link href="/search" className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg font-medium transition-colors">
            Search
          </Link>
          <UserButton afterSignOutUrl="/login" />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 p-6">
        {/* Discover Section */}
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-3xl font-bold mb-6">Discover</h2>
          {posts === undefined ? (
            <div className="animate-pulse flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <p className="text-zinc-500">No posts yet. Be the first to create one!</p>
          ) : (
            posts.map((post) => (
              <div key={post._id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-shadow flex gap-4">
                {/* Voting column */}
                <div className="flex flex-col items-center gap-1">
                  <button 
                    onClick={() => upvote({ id: post._id })}
                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-500 hover:text-blue-500"
                  >
                    <ArrowUp size={24} />
                  </button>
                  <span className="font-bold text-lg">{post.upvotes - post.downvotes}</span>
                  <button 
                    onClick={() => downvote({ id: post._id })}
                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-500"
                  >
                    <ArrowDown size={24} />
                  </button>
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-3">{post.text}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-zinc-500">
                    <span>Posted by {post.authorName}</span>
                    <button className="flex items-center gap-1 hover:text-zinc-800 dark:hover:text-zinc-200">
                      <MessageSquare size={16} /> Reply
                    </button>
                  </div>
                </div>
              </div>
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
                    <div key={i} className="h-16 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                  ))}
                </div>
              ) : popularPosts.length === 0 ? (
                <p className="text-sm text-zinc-500">No popular posts yet.</p>
              ) : (
                popularPosts.map((post) => (
                  <div key={post._id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 pb-3 last:pb-0">
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
