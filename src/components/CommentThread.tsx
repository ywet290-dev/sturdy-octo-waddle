import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { ArrowUp, ArrowDown, MessageSquare, Send, Trash2, Pencil } from "lucide-react";

export function CommentThread({
  comment,
  allComments,
  postId,
  userId,
  userName,
  userImageUrl,
  userVotes,
  depth,
}: {
  comment: Doc<"comments">;
  allComments: Doc<"comments">[];
  postId: Id<"posts">;
  userId: string;
  userName: string;
  userImageUrl?: string;
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
      authorProfileImageUrl: userImageUrl,
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
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden">
                {comment.authorProfileImageUrl ? (
                  <img src={comment.authorProfileImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  comment.authorName?.[0]?.toUpperCase() || "?"
                )}
              </div>
              <p className="text-xs text-zinc-500 font-medium">
                {comment.authorName}
              </p>
            </div>
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
          userImageUrl={userImageUrl}
          userVotes={userVotes}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
