"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { ArrowUp, ArrowDown, MessageSquare, Send, Trash2, Pencil } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import TopBar from "@/components/TopBar";

// ── Nested Comment Component ──
function CommentThread({
  comment,
  allComments,
  postId,
  userId,
  userName,
  userVotes,
  depth,
}: {
  comment: Doc<"comments">;
  allComments: Doc<"comments">[];
  postId: Id<"posts">;
  userId: string;
  userName: string;
  userVotes: Doc<"votes">[];
  depth: number;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  
  const createComment = useMutation(api.comments.createComment);
  const voteComment = useMutation(api.comments.voteComment);
  const deleteComment = useMutation(api.comments.deleteComment);
  const editComment = useMutation(api.comments.editComment);

  const childComments = allComments.filter(
    (c) => c.parentCommentId === comment._id
  );

  const existingVote = userVotes.find(
    (v) => v.targetId === (comment._id as string)
  );
  const score = comment.upvotes - comment.downvotes;
  const isAuthor = comment.authorId === userId;

  const handleReply = async () => {
    if (!replyText.trim()) return;
    await createComment({
      text: replyText,
      postId,
      parentCommentId: comment._id,
      authorId: userId,
      authorName: userName,
    });
    setReplyText("");
    setShowReply(false);
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    await editComment({
      commentId: comment._id,
      text: editText,
      userId,
    });
    setIsEditing(false);
  };

  return (
    <div className={`relative ${depth > 0 ? "ml-6" : ""}`}>
      {/* Vertical thread line connecting to parent */}
      {depth > 0 && (
        <div className="absolute left-[-16px] top-0 bottom-0 w-[2px] bg-zinc-200 dark:bg-zinc-700" />
      )}

      <div className="flex gap-3 py-3">
        {/* Vote buttons */}
        <div className="flex flex-col items-center gap-0.5 pt-1">
          <button
            onClick={() =>
              voteComment({ commentId: comment._id, userId, voteType: "up" })
            }
            className={`p-0.5 rounded transition-colors ${existingVote?.voteType === "up" ? "text-blue-500" : "text-zinc-400 hover:text-blue-500"}`}
          >
            <ArrowUp size={16} />
          </button>
          <span className="text-xs font-bold">{score}</span>
          <button
            onClick={() =>
              voteComment({ commentId: comment._id, userId, voteType: "down" })
            }
            className={`p-0.5 rounded transition-colors ${existingVote?.voteType === "down" ? "text-red-500" : "text-zinc-400 hover:text-red-500"}`}
          >
            <ArrowDown size={16} />
          </button>
        </div>

        {/* Comment content */}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <p className="text-xs text-zinc-500 mb-1 font-medium">
              {comment.authorName}
            </p>
            <div className="flex gap-2">
              {isAuthor && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-zinc-400 hover:text-blue-500 transition-colors"
                >
                  <Pencil size={12} />
                </button>
              )}
              {isAuthor && (
                <button
                  onClick={() => {
                    if (confirm("Delete this comment?")) {
                      deleteComment({ commentId: comment._id, userId });
                    }
                  }}
                  className="text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
          
          {isEditing ? (
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:border-blue-500 transition-colors"
                onKeyDown={(e) => e.key === "Enter" && handleEdit()}
              />
              <button
                onClick={handleEdit}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition-colors"
              >
                Save
              </button>
            </div>
          ) : (
            <p className="text-sm text-zinc-800 dark:text-zinc-200">
              {comment.text}
            </p>
          )}

          <button
            onClick={() => setShowReply(!showReply)}
            className="text-xs text-zinc-500 hover:text-blue-500 mt-1 flex items-center gap-1 transition-colors"
          >
            <MessageSquare size={12} /> Reply
          </button>

          {showReply && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:border-blue-500 transition-colors"
                onKeyDown={(e) => e.key === "Enter" && handleReply()}
              />
              <button
                onClick={handleReply}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Nested child replies */}
      {childComments.map((child: Doc<"comments">) => (
        <CommentThread
          key={child._id}
          comment={child}
          allComments={allComments}
          postId={postId}
          userId={userId}
          userName={userName}
          userVotes={userVotes}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

// ── Post Image Component ──
function PostImage({ imageId }: { imageId: Id<"_storage"> }) {
  const imageUrl = useQuery(api.files.getImageUrl, { storageId: imageId });
  if (!imageUrl) return null;
  return (
    <img
      src={imageUrl}
      alt="Post image"
      className="w-full max-h-96 object-cover rounded-lg mb-4"
    />
  );
}

// ── Post Card Component ──
function PostCard({
  post,
  userId,
  userName,
  userVotes,
}: {
  post: Doc<"posts">;
  userId: string;
  userName: string;
  userVotes: Doc<"votes">[];
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editText, setEditText] = useState(post.text);

  const votePost = useMutation(api.posts.votePost);
  const deletePost = useMutation(api.posts.deletePost);
  const editPost = useMutation(api.posts.editPost);
  const createComment = useMutation(api.comments.createComment);
  const comments = useQuery(
    api.comments.getCommentsForPost,
    showComments ? { postId: post._id } : "skip"
  );

  const existingVote = userVotes.find(
    (v) => v.targetId === (post._id as string)
  );
  const score = post.upvotes - post.downvotes;
  const isAuthor = post.authorId === userId;

  // Get only top-level comments (no parent)
  const topLevelComments = comments?.filter((c) => !c.parentCommentId) ?? [];

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    await createComment({
      text: commentText,
      postId: post._id,
      authorId: userId,
      authorName: userName,
    });
    setCommentText("");
  };

  const handleEdit = async () => {
    if (!editTitle.trim() || !editText.trim()) return;
    await editPost({
      postId: post._id,
      title: editTitle,
      text: editText,
      userId,
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Voting column */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() =>
              votePost({ postId: post._id, userId, voteType: "up" })
            }
            className={`p-1 rounded transition-colors ${existingVote?.voteType === "up" ? "text-blue-500 bg-blue-50 dark:bg-blue-500/10" : "text-zinc-400 hover:text-blue-500"}`}
          >
            <ArrowUp size={24} />
          </button>
          <span className="font-bold text-lg">{score}</span>
          <button
            onClick={() =>
              votePost({ postId: post._id, userId, voteType: "down" })
            }
            className={`p-1 rounded transition-colors ${existingVote?.voteType === "down" ? "text-red-500 bg-red-50 dark:bg-red-500/10" : "text-zinc-400 hover:text-red-500"}`}
          >
            <ArrowDown size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-xl font-bold w-full bg-transparent border-b border-zinc-300 dark:border-zinc-700 outline-none focus:border-blue-500 transition-colors"
              />
            ) : (
              <h3 className="text-xl font-bold">{post.title}</h3>
            )}
            
            <div className="flex gap-2 ml-4">
              {isAuthor && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-1 text-zinc-400 hover:text-blue-500 transition-colors"
                >
                  <Pencil size={16} />
                </button>
              )}
              {isAuthor && (
                <button
                  onClick={() => {
                    if (confirm("Delete this post?")) {
                      deletePost({ postId: post._id, userId });
                    }
                  }}
                  className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
          
          {post.imageId && <PostImage imageId={post.imageId} />}
          
          {isEditing ? (
            <div className="space-y-3 mb-4">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full min-h-[100px] p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:border-blue-500 transition-colors resize-y"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <p className="text-zinc-600 dark:text-zinc-400 mb-4 whitespace-pre-wrap">
              {post.text}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <span>Posted by {post.authorName}</span>
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
            >
              <MessageSquare size={16} />{" "}
              {showComments ? "Hide Replies" : "Replies"}
            </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          {/* New comment input */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:border-blue-500 transition-colors text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
            />
            <button
              onClick={handleAddComment}
              disabled={!commentText.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>

          {/* Comment threads */}
          {comments === undefined ? (
            <p className="text-sm text-zinc-500 animate-pulse">
              Loading replies...
            </p>
          ) : topLevelComments.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No replies yet. Be the first!
            </p>
          ) : (
            topLevelComments.map((comment: Doc<"comments">) => (
              <CommentThread
                key={comment._id}
                comment={comment}
                allComments={comments}
                postId={post._id}
                userId={userId}
                userName={userName}
                userVotes={userVotes}
                depth={0}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

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
