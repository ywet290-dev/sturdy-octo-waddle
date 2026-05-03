"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { Search, ArrowUp, ArrowDown } from "lucide-react";
import TopBar from "@/components/TopBar";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const results = useQuery(api.posts.searchPosts, { query: searchQuery });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <TopBar />

      <main className="max-w-4xl mx-auto p-6 space-y-8 mt-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={24} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for posts, topics, or questions..."
            className="w-full pl-14 pr-6 py-4 text-lg rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:border-blue-500 focus:ring-0 outline-none transition-colors shadow-sm"
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            {searchQuery ? `Search Results for "${searchQuery}"` : "Recent Posts"}
          </h2>
          
          {results === undefined ? (
            <div className="animate-pulse space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              No results found for "{searchQuery}". Try a different keyword.
            </div>
          ) : (
            results.map((post: Doc<"posts">) => (
              <div key={post._id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 flex gap-4">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-zinc-500"><ArrowUp size={20} /></span>
                  <span className="font-bold">{post.upvotes - post.downvotes}</span>
                  <span className="text-zinc-500"><ArrowDown size={20} /></span>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">{post.title}</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-2 line-clamp-2">{post.text}</p>
                  <p className="text-sm text-zinc-500">By {post.authorName}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
