"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import TopBar from "@/components/TopBar";
import { PostCard } from "@/components/PostCard";
import { CommentThread } from "@/components/CommentThread";
import { FileText, MessageSquare, Settings, ShieldAlert, Lock, Unlock } from "lucide-react";
import { Doc } from "../../../convex/_generated/dataModel";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<"posts" | "comments" | "settings">("posts");

  const myPosts = useQuery(
    api.posts.getPostsByAuthor,
    user ? { authorId: user.id } : "skip"
  );

  const myComments = useQuery(
    api.comments.getCommentsByAuthor,
    user ? { authorId: user.id } : "skip"
  );

  const userVotes = useQuery(
    api.posts.getUserVotes,
    user ? { userId: user.id } : "skip"
  );

  const convexUser = useQuery(
    api.users.getUser,
    user ? { clerkId: user.id } : "skip"
  );

  const blockedUsers = useQuery(
    api.users.getBlockedUsers,
    user ? { clerkId: user.id } : "skip"
  );

  const togglePrivacy = useMutation(api.users.togglePrivacy);
  const unblockUser = useMutation(api.users.unblockUser);

  if (!isLoaded || !user) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <TopBar />
      
      <main className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Profile Header */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm mb-6 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white dark:border-zinc-800 shadow-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
            {user.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={user.fullName || "Profile"}
                className="w-full h-full object-cover"
              />
            ) : (
              (user.fullName || user.username || "?")[0].toUpperCase()
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">
              {user.fullName || user.username || "Anonymous User"}
            </h1>
            <p className="text-zinc-500 mb-4">
              {user.primaryEmailAddress?.emailAddress}
            </p>
            <div className="flex justify-center md:justify-start gap-4 text-sm font-medium">
              <div className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg">
                <span className="text-lg block font-bold">{myPosts?.length || 0}</span> Posts
              </div>
              <div className="bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 px-4 py-2 rounded-lg">
                <span className="text-lg block font-bold">{myComments?.length || 0}</span> Comments
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-px">
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex items-center gap-2 pb-3 px-2 text-sm font-bold transition-colors relative ${activeTab === "posts" ? "text-blue-600 dark:text-blue-400" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"}`}
          >
            <FileText size={18} /> My Posts
            {activeTab === "posts" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`flex items-center gap-2 pb-3 px-2 text-sm font-bold transition-colors relative ${activeTab === "comments" ? "text-purple-600 dark:text-purple-400" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"}`}
          >
            <MessageSquare size={18} /> My Comments
            {activeTab === "comments" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 pb-3 px-2 text-sm font-bold transition-colors relative ${activeTab === "settings" ? "text-red-600 dark:text-red-400" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"}`}
          >
            <Settings size={18} /> Settings
            {activeTab === "settings" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 dark:bg-red-400 rounded-t-full" />
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="space-y-6 pb-20">
          {activeTab === "posts" && (
            <div>
              {myPosts === undefined || userVotes === undefined ? (
                <div className="text-center py-10 text-zinc-500 animate-pulse font-medium">
                  Loading posts...
                </div>
              ) : myPosts.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <FileText className="mx-auto w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-4" />
                  <p className="text-zinc-500 font-medium">You haven't made any posts yet.</p>
                </div>
              ) : (
                myPosts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    userId={user.id}
                    userName={user.fullName || user.username || "Anonymous"}
                    userVotes={userVotes}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === "comments" && (
            <div>
              {myComments === undefined || userVotes === undefined ? (
                <div className="text-center py-10 text-zinc-500 animate-pulse font-medium">
                  Loading comments...
                </div>
              ) : myComments.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <MessageSquare className="mx-auto w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-4" />
                  <p className="text-zinc-500 font-medium">You haven't made any comments yet.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {myComments.map((comment: Doc<"comments">) => (
                      <CommentThread
                        key={comment._id}
                        comment={comment}
                        allComments={[]} // Flat list, no nesting
                        postId={comment.postId}
                        userId={user.id}
                        userName={user.fullName || user.username || "Anonymous"}
                        userVotes={userVotes}
                        depth={0}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              {/* Privacy Toggle */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      {convexUser?.isPrivate ? <Lock className="text-red-500" size={20} /> : <Unlock className="text-green-500" size={20} />}
                      Private Mode
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1">
                      When enabled, only your contacts can see your posts and profile details.
                    </p>
                  </div>
                  <button
                    onClick={() => user && togglePrivacy({ clerkId: user.id })}
                    className={`px-4 py-2 rounded-full font-bold text-sm transition-colors ${
                      convexUser?.isPrivate
                        ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {convexUser?.isPrivate ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>

              {/* Blocked Users */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <ShieldAlert className="text-red-500" size={20} />
                  Blocked Users
                </h3>
                {blockedUsers === undefined ? (
                  <p className="text-sm text-zinc-500 animate-pulse">Loading...</p>
                ) : blockedUsers.length === 0 ? (
                  <p className="text-sm text-zinc-500">You haven't blocked anyone.</p>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden">
                    {blockedUsers.map((u: Doc<"users">) => (
                      <div key={u._id} className="p-4 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center text-white font-bold overflow-hidden">
                            {u.profileImageUrl ? (
                              <img src={u.profileImageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              u.name?.[0]?.toUpperCase() || "?"
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{u.name || "Unknown User"}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => user && u.clerkId && unblockUser({ myClerkId: user.id, targetClerkId: u.clerkId })}
                          className="px-3 py-1.5 text-xs font-bold text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
