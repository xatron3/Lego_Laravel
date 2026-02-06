import { Link } from "@inertiajs/react";
import { PostData, socialApi, MocMetadata } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { useState } from "react";
import PostImageGallery from "./PostImageGallery";
import FollowButton from "./FollowButton";

interface PostCardProps {
    post: PostData;
    onPostDeleted?: (postId: number) => void;
}

function timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    return date.toLocaleDateString();
}

function isMocMetadata(metadata: any): metadata is MocMetadata {
    return (
        metadata &&
        typeof metadata === "object" &&
        "moc_id" in metadata &&
        "set_num" in metadata &&
        "price" in metadata &&
        "total_parts" in metadata &&
        "total_steps" in metadata
    );
}

export default function PostCard({ post, onPostDeleted }: PostCardProps) {
    const { user } = useAuth();
    const [isLiked, setIsLiked] = useState(post.is_liked);
    const [likesCount, setLikesCount] = useState(post.likes_count);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isFollowing, setIsFollowing] = useState(post.is_following ?? false);

    const isSelf = user?.id === post.user_id;
    const isFromFeed = post.is_from_feed ?? false;

    const handleLike = async () => {
        if (!user) return;
        try {
            if (isLiked) {
                const result = await socialApi.unlikePost(post.id);
                setIsLiked(false);
                setLikesCount(result.likes_count);
            } else {
                const result = await socialApi.likePost(post.id);
                setIsLiked(true);
                setLikesCount(result.likes_count);
            }
        } catch {
            // Revert on error
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await socialApi.deletePost(post.id);
            onPostDeleted?.(post.id);
        } catch {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const postTypeLabel =
        post.type === "moc"
            ? "MOC"
            : post.type === "build"
              ? "LEGO Build"
              : post.type;
    const isMoc = post.type === "moc";

    return (
        <article
            className={`bg-gray-800/50 border rounded-xl overflow-hidden hover:border-gray-600 transition-colors ${
                isFromFeed ? "border-blue-500/30" : "border-gray-700"
            }`}
        >
            {/* Post Header */}
            <div className="flex items-center justify-between p-4 pb-3">
                <div className="flex items-center gap-3 flex-1">
                    <Link
                        href={
                            post.user.username
                                ? `/u/${post.user.username}`
                                : "#"
                        }
                    >
                        {post.user.avatar ? (
                            <img
                                src={post.user.avatar}
                                alt={post.user.name}
                                className={`w-10 h-10 rounded-full object-cover ring-2 ${
                                    isFromFeed
                                        ? "ring-blue-500/50"
                                        : "ring-gray-700"
                                }`}
                            />
                        ) : (
                            <div
                                className={`w-10 h-10 rounded-full bg-linear-to-br from-yellow-400 to-orange-500 flex items-center justify-center ring-2 ${
                                    isFromFeed
                                        ? "ring-blue-500/50"
                                        : "ring-gray-700"
                                }`}
                            >
                                <span className="text-sm font-bold text-white">
                                    {post.user.name?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <Link
                                href={
                                    post.user.username
                                        ? `/u/${post.user.username}`
                                        : "#"
                                }
                                className="text-white font-semibold hover:text-yellow-400 transition-colors text-sm"
                            >
                                {post.user.name}
                            </Link>
                            {isSelf ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full text-xs font-medium">
                                    <svg
                                        className="w-3 h-3"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    You
                                </span>
                            ) : isFromFeed ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-xs font-medium">
                                    <svg
                                        className="w-3 h-3"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                    </svg>
                                    Following
                                </span>
                            ) : null}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 rounded-full">
                                <svg
                                    className="w-3 h-3"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                                {postTypeLabel}
                            </span>
                            <span>·</span>
                            <span>{timeAgo(post.created_at)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isSelf && user && (
                        <FollowButton
                            userId={post.user_id}
                            isFollowing={isFollowing}
                            onFollowChange={(following) =>
                                setIsFollowing(following)
                            }
                            size="sm"
                        />
                    )}

                    {isSelf && (
                        <div className="relative">
                            {showDeleteConfirm ? (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-500 disabled:opacity-50"
                                    >
                                        {isDeleting ? "..." : "Delete"}
                                    </button>
                                    <button
                                        onClick={() =>
                                            setShowDeleteConfirm(false)
                                        }
                                        className="text-xs px-2 py-1 bg-gray-600 text-gray-300 rounded hover:bg-gray-500"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-700/50 transition-colors"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 5v.01M12 12v.01M12 19v.01"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Post Title */}
            {post.title && (
                <div className="px-4 pb-2">
                    <Link
                        href={`/community/posts/${post.id}`}
                        className="text-lg font-semibold text-white hover:text-yellow-400 transition-colors"
                    >
                        {post.title}
                    </Link>
                </div>
            )}

            {/* Post Body */}
            {post.body && (
                <div className="px-4 pb-3">
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                        {post.body.length > 300
                            ? post.body.slice(0, 300) + "..."
                            : post.body}
                    </p>
                    {post.body.length > 300 && (
                        <Link
                            href={`/community/posts/${post.id}`}
                            className="text-yellow-400 text-sm hover:text-yellow-300 mt-1 inline-block"
                        >
                            Read more
                        </Link>
                    )}
                </div>
            )}

            {/* MOC Metadata */}
            {isMoc && isMocMetadata(post.metadata) && (
                <div className="mx-4 mb-3 p-3 bg-linear-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-1.5">
                                <svg
                                    className="w-4 h-4 text-green-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <span className="text-white font-medium">
                                    {post.metadata.price > 0
                                        ? `$${parseFloat(String(post.metadata.price)).toFixed(2)}`
                                        : "Free"}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <svg
                                    className="w-4 h-4 text-blue-400"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                                <span className="text-gray-300">
                                    {post.metadata.total_parts.toLocaleString()}{" "}
                                    parts
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <svg
                                    className="w-4 h-4 text-purple-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                    />
                                </svg>
                                <span className="text-gray-300">
                                    {post.metadata.total_steps} steps
                                </span>
                            </div>
                        </div>
                        <Link
                            href={`/mocs/${post.metadata.moc_id}`}
                            className="px-3 py-1.5 bg-linear-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 text-xs font-bold rounded-lg transition-all whitespace-nowrap"
                        >
                            View in Store →
                        </Link>
                    </div>
                </div>
            )}

            {/* Post Images */}
            {post.images.length > 0 && (
                <PostImageGallery images={post.images} />
            )}

            {/* Post Actions */}
            <div className="flex items-center gap-6 px-4 py-3 border-t border-gray-700/50">
                <button
                    onClick={handleLike}
                    disabled={!user}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                        isLiked
                            ? "text-red-400 hover:text-red-300"
                            : "text-gray-400 hover:text-red-400"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    <svg
                        className="w-5 h-5"
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
                    <span>{likesCount}</span>
                </button>

                <Link
                    href={`/community/posts/${post.id}`}
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-400 transition-colors"
                >
                    <svg
                        className="w-5 h-5"
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
                    <span>{post.comments_count}</span>
                </Link>

                <Link
                    href={`/community/posts/${post.id}`}
                    className="ml-auto text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                    View post →
                </Link>
            </div>
        </article>
    );
}
