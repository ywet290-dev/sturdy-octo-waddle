import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { ArrowUp, ArrowDown, MessageSquare, Send, Trash2, Pencil } from "lucide-react";
import { CommentThread } from "./CommentThread";

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

export function PostCard({
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
