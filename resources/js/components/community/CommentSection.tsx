import { useState } from "react";
import { CommentData, socialApi } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { Link } from "@inertiajs/react";

interface CommentSectionProps {
    postId: number;
    comments: CommentData[];
    onCommentAdded?: () => void;
}

function timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return new Date(dateString).toLocaleDateString();
}

function CommentItem({
    comment,
    postId,
    onReply,
    onDelete,
    depth = 0,
}: {
    comment: CommentData;
    postId: number;
    onReply: (commentId: number) => void;
    onDelete: (commentId: number) => void;
    depth?: number;
}) {
    const { user } = useAuth();
    const [isLiked, setIsLiked] = useState(comment.is_liked);
    const [likesCount, setLikesCount] = useState(comment.likes_count);

    const handleLike = async () => {
        if (!user) return;
        try {
            if (isLiked) {
                const result = await socialApi.unlikeComment(comment.id);
                setIsLiked(false);
                setLikesCount(result.likes_count);
            } else {
                const result = await socialApi.likeComment(comment.id);
                setIsLiked(true);
                setLikesCount(result.likes_count);
            }
        } catch {
            // Revert on error
        }
    };

    const isSelf = user?.id === comment.user_id;

    return (
        <div
            className={`${depth > 0 ? "ml-8 border-l border-gray-700/50 pl-4" : ""}`}
        >
            <div className="flex gap-3 py-3">
                <Link
                    href={
                        comment.user.username
                            ? `/u/${comment.user.username}`
                            : "#"
                    }
                    className="shrink-0"
                >
                    {comment.user.avatar ? (
                        <img
                            src={comment.user.avatar}
                            alt={comment.user.name}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">
                                {comment.user.name?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="bg-gray-700/30 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 mb-0.5">
                            <Link
                                href={
                                    comment.user.username
                                        ? `/u/${comment.user.username}`
                                        : "#"
                                }
                                className="text-sm font-semibold text-white hover:text-yellow-400 transition-colors"
                            >
                                {comment.user.name}
                            </Link>
                            <span className="text-xs text-gray-500">
                                {timeAgo(comment.created_at)}
                            </span>
                        </div>
                        <p className="text-sm text-gray-300 whitespace-pre-line">
                            {comment.body}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 mt-1 ml-1">
                        <button
                            onClick={handleLike}
                            disabled={!user}
                            className={`flex items-center gap-1 text-xs transition-colors ${
                                isLiked
                                    ? "text-red-400"
                                    : "text-gray-500 hover:text-red-400"
                            } disabled:opacity-50`}
                        >
                            <svg
                                className="w-3.5 h-3.5"
                                fill={isLiked ? "currentColor" : "none"}
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                            </svg>
                            {likesCount > 0 && <span>{likesCount}</span>}
                        </button>

                        {user && depth === 0 && (
                            <button
                                onClick={() => onReply(comment.id)}
                                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                            >
                                Reply
                            </button>
                        )}

                        {isSelf && (
                            <button
                                onClick={() => onDelete(comment.id)}
                                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div>
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            postId={postId}
                            onReply={onReply}
                            onDelete={onDelete}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function CommentSection({
    postId,
    comments: initialComments,
    onCommentAdded,
}: CommentSectionProps) {
    const { user } = useAuth();
    const [comments, setComments] = useState(initialComments);
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const comment = await socialApi.addComment(
                postId,
                newComment.trim(),
                replyingTo ?? undefined,
            );

            if (replyingTo) {
                // Add reply to parent comment
                setComments((prev) =>
                    prev.map((c) =>
                        c.id === replyingTo
                            ? { ...c, replies: [...(c.replies || []), comment] }
                            : c,
                    ),
                );
            } else {
                // Add as new top-level comment
                setComments((prev) => [comment, ...prev]);
            }

            setNewComment("");
            setReplyingTo(null);
            onCommentAdded?.();
        } catch {
            // Error handling
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (commentId: number) => {
        try {
            await socialApi.deleteComment(postId, commentId);
            // Remove from top level or from replies
            setComments((prev) =>
                prev
                    .filter((c) => c.id !== commentId)
                    .map((c) => ({
                        ...c,
                        replies: c.replies?.filter((r) => r.id !== commentId),
                    })),
            );
        } catch {
            // Error handling
        }
    };

    return (
        <div>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                </svg>
                Comments ({comments.length})
            </h3>

            {/* Comment Input */}
            {user ? (
                <form onSubmit={handleSubmit} className="mb-6">
                    {replyingTo && (
                        <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                            <span>Replying to comment</span>
                            <button
                                type="button"
                                onClick={() => setReplyingTo(null)}
                                className="text-yellow-400 hover:text-yellow-300"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shrink-0">
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                            ) : (
                                <span className="text-xs font-bold text-white">
                                    {user.name?.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="flex-1">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                rows={2}
                                maxLength={1000}
                                className="w-full bg-gray-700/30 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 outline-none resize-none"
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    type="submit"
                                    disabled={
                                        !newComment.trim() || isSubmitting
                                    }
                                    className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? "Posting..." : "Comment"}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            ) : (
                <p className="text-gray-500 text-sm mb-6">
                    Sign in to leave a comment.
                </p>
            )}

            {/* Comments List */}
            <div className="divide-y divide-gray-700/30">
                {comments.map((comment) => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        postId={postId}
                        onReply={setReplyingTo}
                        onDelete={handleDelete}
                    />
                ))}
            </div>

            {comments.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-8">
                    No comments yet. Be the first to share your thoughts!
                </p>
            )}
        </div>
    );
}
