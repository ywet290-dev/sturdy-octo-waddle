"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import { PostCard } from "@/components/PostCard";
import { FileText, ShieldAlert, Lock, UserPlus, UserMinus, MessageCircle } from "lucide-react";
import { Doc } from "../../../../convex/_generated/dataModel";

export default function PublicProfilePage() {
  const { user: currentUser, isLoaded } = useUser();
  const params = useParams();
  const router = useRouter();
  const clerkId = params.clerkId as string;

  const profileUser = useQuery(api.users.getUser, { clerkId });
  const currentUserData = useQuery(
    api.users.getUser,
    currentUser ? { clerkId: currentUser.id } : "skip"
  );
  
  const userPosts = useQuery(api.posts.getPostsByAuthor, { authorId: clerkId });
  const userVotes = useQuery(
    api.posts.getUserVotes,
    currentUser ? { userId: currentUser.id } : "skip"
  );

  const blockUser = useMutation(api.users.blockUser);
  const unblockUser = useMutation(api.users.unblockUser);
  const addContact = useMutation(api.users.addContact);
  const removeContact = useMutation(api.users.removeContact);

  if (!isLoaded || profileUser === undefined || currentUserData === undefined) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
        <p className="animate-pulse">Loading profile...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <TopBar />
        <div className="max-w-4xl mx-auto p-6 text-center mt-20">
          <h1 className="text-2xl font-bold mb-2">User not found</h1>
          <p className="text-zinc-500">This profile does not exist.</p>
        </div>
      </div>
    );
  }

  // Check if current user has blocked this profile
  const hasBlocked = currentUserData?.blockedUsers?.includes(clerkId) || false;
  // Check if profile user has blocked current user
  const isBlockedBy = profileUser?.blockedUsers?.includes(currentUser?.id || "") || false;
  
  const isContact = currentUserData?.contacts?.includes(clerkId) || false;

  // Profile Privacy Logic
  let canViewContent = true;
  if (isBlockedBy) {
    canViewContent = false;
  } else if (profileUser.isPrivate && !isContact && currentUser?.id !== clerkId) {
    canViewContent = false;
  }

  if (isBlockedBy) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <TopBar />
        <div className="max-w-4xl mx-auto p-6 text-center mt-20">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Profile Unavailable</h1>
          <p className="text-zinc-500">You do not have permission to view this profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <TopBar />
      
      <main className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Profile Header */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm mb-6 flex flex-col md:flex-row items-center md:items-start gap-6 relative">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white dark:border-zinc-800 shadow-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
            {profileUser.profileImageUrl ? (
              <img
                src={profileUser.profileImageUrl}
                alt={profileUser.name || "Profile"}
                className="w-full h-full object-cover"
              />
            ) : (
              (profileUser.name || "?")[0].toUpperCase()
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2 flex items-center justify-center md:justify-start gap-2">
              {profileUser.name || "Anonymous User"}
              {profileUser.isPrivate && <span title="Private Profile"><Lock size={18} className="text-zinc-400" /></span>}
            </h1>
            <p className="text-zinc-500 mb-4 flex items-center justify-center md:justify-start gap-2">
              {profileUser.email}
              {profileUser.isOnline && <span className="bg-green-500 w-2.5 h-2.5 rounded-full inline-block" title="Online"></span>}
            </p>

            {currentUser && currentUser.id !== clerkId && (
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                <button
                  onClick={() => router.push(`/messages?chat=${clerkId}&name=${encodeURIComponent(profileUser.name || "User")}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-bold"
                >
                  <MessageCircle size={16} /> Message
                </button>

                {isContact ? (
                  <button
                    onClick={() => removeContact({ myClerkId: currentUser.id, contactClerkId: clerkId })}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors text-sm font-bold"
                  >
                    <UserMinus size={16} /> Remove Contact
                  </button>
                ) : (
                  <button
                    onClick={() => addContact({ myClerkId: currentUser.id, contactClerkId: clerkId })}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors text-sm font-bold"
                  >
                    <UserPlus size={16} /> Add Contact
                  </button>
                )}

                {hasBlocked ? (
                  <button
                    onClick={() => unblockUser({ myClerkId: currentUser.id, targetClerkId: clerkId })}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg transition-colors text-sm font-bold"
                  >
                    Unblock
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to block this user?")) {
                        blockUser({ myClerkId: currentUser.id, targetClerkId: clerkId });
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-sm font-bold"
                  >
                    Block
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-6 pb-20">
          {!canViewContent ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <Lock className="mx-auto w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-4" />
              <h2 className="text-xl font-bold mb-2">This account is private</h2>
              <p className="text-zinc-500 font-medium">Add this user as a contact to see their posts.</p>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                <FileText size={20} /> Posts
              </h2>
              {userPosts === undefined || userVotes === undefined ? (
                <div className="text-center py-10 text-zinc-500 animate-pulse font-medium">
                  Loading posts...
                </div>
              ) : userPosts.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <p className="text-zinc-500 font-medium">No posts yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {userPosts.map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      userId={currentUser?.id || ""}
                      userName={currentUser?.fullName || currentUser?.username || "Anonymous"}
                      userVotes={userVotes}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
