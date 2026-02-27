import { useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import Header from "../../components/Header";
import { useAuth } from "../../contexts/AuthContext";
import { PostData, socialApi } from "../../api";
import PostImageGallery from "../../components/community/PostImageGallery";
import CommentSection from "../../components/community/CommentSection";

interface PostDetailProps {
    post: PostData;
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

export default function PostDetail({ post: initialPost }: PostDetailProps) {
    const { user } = useAuth();
    const [post] = useState(initialPost);
    const [isLiked, setIsLiked] = useState(post.is_liked);
    const [likesCount, setLikesCount] = useState(post.likes_count);
    const [commentsCount, setCommentsCount] = useState(post.comments_count);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const isSelf = user?.id === post.user_id;

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
        try {
            await socialApi.deletePost(post.id);
            if (post.user.username) {
                router.visit(`/u/${post.user.username}`);
            } else {
                router.visit("/community");
            }
        } catch {
            setShowDeleteConfirm(false);
        }
    };

    const postTypeLabel = post.type === "build" ? "LEGO Build" : post.type;

    const pageTitle = post.title
        ? `${post.title} - ${post.user.name}'s ${postTypeLabel} | BrickOasis`
        : `${post.user.name}'s ${postTypeLabel} | BrickOasis`;

    const pageDescription = post.description
        ? `${post.description.substring(0, 150)}${post.description.length > 150 ? "..." : ""} - Shared by ${post.user.name} on BrickOasis LEGO community.`
        : `View ${post.user.name}'s ${postTypeLabel} on BrickOasis. Join the LEGO builder community to share and discover amazing creations.`;

    return (
        <div className="min-h-screen bg-gray-900">
            <Head>
                <title>{pageTitle}</title>
                <meta name="description" content={pageDescription} />
                <meta
                    name="keywords"
                    content={`LEGO build, ${post.user.name}, LEGO community, LEGO creation, builder showcase`}
                />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={pageDescription} />
                <meta property="og:type" content="article" />
                {post.images && post.images.length > 0 && (
                    <meta property="og:image" content={post.images[0].url} />
                )}
                <link
                    rel="canonical"
                    href={`${window.location.origin}/community/posts/${post.id}`}
                />
            </Head>

            <Header />

            <div className="max-w-2xl mx-auto px-4 pt-24 pb-12">
                {/* Back Link */}
                <Link
                    href="/community"
                    className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-300 text-sm mb-6 transition-colors"
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    Back to feed
                </Link>

                {/* Post Content */}
                <article className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                    {/* Post Header */}
                    <div className="flex items-center justify-between p-5 pb-3">
                        <div className="flex items-center gap-3">
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
                                        className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-700"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-yellow-400 to-orange-500 flex items-center justify-center ring-2 ring-gray-700">
                                        <span className="text-lg font-bold text-white">
                                            {post.user.name
                                                ?.charAt(0)
                                                .toUpperCase()}
                                        </span>
                                    </div>
                                )}
                            </Link>
                            <div>
                                <Link
                                    href={
                                        post.user.username
                                            ? `/u/${post.user.username}`
                                            : "#"
                                    }
                                    className="text-white font-semibold hover:text-yellow-400 transition-colors"
                                >
                                    {post.user.name}
                                </Link>
                                {post.user.username && (
                                    <span className="text-gray-500 text-sm ml-1.5">
                                        @{post.user.username}
                                    </span>
                                )}
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

                        {isSelf && (
                            <div>
                                {showDeleteConfirm ? (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleDelete}
                                            className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-500"
                                        >
                                            Delete
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
                                        onClick={() =>
                                            setShowDeleteConfirm(true)
                                        }
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
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    {post.title && (
                        <div className="px-5 pb-2">
                            <h1 className="text-xl font-bold text-white">
                                {post.title}
                            </h1>
                        </div>
                    )}

                    {/* Body */}
                    {post.body && (
                        <div className="px-5 pb-4">
                            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                                {post.body}
                            </p>
                        </div>
                    )}

                    {/* Images */}
                    {post.images.length > 0 && (
                        <PostImageGallery images={post.images} />
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-6 px-5 py-4 border-t border-gray-700/50">
                        <button
                            onClick={handleLike}
                            disabled={!user}
                            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
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
                            <span>
                                {likesCount}{" "}
                                {likesCount === 1 ? "like" : "likes"}
                            </span>
                        </button>

                        <div className="flex items-center gap-2 text-sm text-gray-400">
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
                            <span>
                                {commentsCount}{" "}
                                {commentsCount === 1 ? "comment" : "comments"}
                            </span>
                        </div>
                    </div>
                </article>

                {/* Comments Section */}
                <div className="mt-6 bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                    <CommentSection
                        postId={post.id}
                        comments={post.top_level_comments || []}
                        onCommentAdded={() => setCommentsCount((c) => c + 1)}
                    />
                </div>
            </div>
        </div>
    );
}
