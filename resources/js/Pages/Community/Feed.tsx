import { useState, useCallback } from "react";
import { Head, router } from "@inertiajs/react";
import Header from "../../components/Header";
import { useAuth } from "../../contexts/AuthContext";
import { PostData, PaginatedResponse, socialApi } from "../../api";
import PostCard from "../../components/community/PostCard";
import CreatePostForm from "../../components/community/CreatePostForm";

interface FeedProps {
    initialPosts: PaginatedResponse<PostData>;
}

export default function Feed({ initialPosts }: FeedProps) {
    const { isAuthenticated } = useAuth();
    const [posts, setPosts] = useState<PostData[]>(initialPosts.data);
    const [currentPage, setCurrentPage] = useState(initialPosts.current_page);
    const [lastPage, setLastPage] = useState(initialPosts.last_page);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const handlePostCreated = () => {
        router.reload();
    };

    const handlePostDeleted = (postId: number) => {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
    };

    const loadMore = useCallback(async () => {
        if (currentPage >= lastPage || isLoadingMore) return;

        setIsLoadingMore(true);
        try {
            const result = await socialApi.getFeed(currentPage + 1);
            setPosts((prev) => [...prev, ...result.data]);
            setCurrentPage(result.current_page);
            setLastPage(result.last_page);
        } catch {
            // Error handling
        } finally {
            setIsLoadingMore(false);
        }
    }, [currentPage, lastPage, isLoadingMore]);

    return (
        <div className="min-h-screen bg-gray-900">
            <Head title="Community Feed" />
            <Header currentPage="community" />

            <div className="max-w-2xl mx-auto px-4 pt-24 pb-12">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Community Feed
                    </h1>
                    <p className="text-gray-400">
                        See the latest builds from builders you follow
                    </p>
                </div>

                {/* Create Post */}
                {isAuthenticated && (
                    <div className="mb-6">
                        <CreatePostForm onPostCreated={handlePostCreated} />
                    </div>
                )}

                {/* Posts Feed */}
                {posts.length > 0 ? (
                    <div className="space-y-6">
                        {posts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onPostDeleted={handlePostDeleted}
                            />
                        ))}

                        {/* Load More */}
                        {currentPage < lastPage && (
                            <div className="flex justify-center py-4">
                                <button
                                    onClick={loadMore}
                                    disabled={isLoadingMore}
                                    className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isLoadingMore ? (
                                        <span className="flex items-center gap-2">
                                            <svg
                                                className="w-4 h-4 animate-spin"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                                />
                                            </svg>
                                            Loading...
                                        </span>
                                    ) : (
                                        "Load more"
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
                            <svg
                                className="w-10 h-10 text-gray-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            Your feed is empty
                        </h3>
                        <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                            Follow other builders to see their latest creations
                            here, or share your own build to get started!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
