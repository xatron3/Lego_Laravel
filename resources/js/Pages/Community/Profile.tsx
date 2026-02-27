import { useState, useCallback } from "react";
import { Head, Link, router } from "@inertiajs/react";
import Header from "../../components/Header";
import { useAuth } from "../../contexts/AuthContext";
import {
    PostData,
    PaginatedResponse,
    ProfileUser,
    ProfileStats,
    socialApi,
} from "../../api";
import PostCard from "../../components/community/PostCard";
import CreatePostForm from "../../components/community/CreatePostForm";
import FollowButton from "../../components/community/FollowButton";

interface ProfileProps {
    profileUser: ProfileUser;
    stats: ProfileStats;
    isFollowing: boolean;
    isSelf: boolean;
    initialPosts: PaginatedResponse<PostData>;
}

export default function Profile({
    profileUser,
    stats: initialStats,
    isFollowing: initialIsFollowing,
    isSelf,
    initialPosts,
}: ProfileProps) {
    const { user } = useAuth();
    const [stats, setStats] = useState(initialStats);
    const [posts, setPosts] = useState<PostData[]>(initialPosts.data);
    const [currentPage, setCurrentPage] = useState(initialPosts.current_page);
    const [lastPage, setLastPage] = useState(initialPosts.last_page);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [activeTab, setActiveTab] = useState<"builds" | "about">("builds");

    // Profile editing state
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [editBio, setEditBio] = useState(profileUser.bio || "");
    const [isSavingBio, setIsSavingBio] = useState(false);

    const handleFollowChange = (
        _isFollowing: boolean,
        followersCount: number,
    ) => {
        setStats((prev) => ({
            ...prev,
            followers_count: followersCount,
        }));
    };

    const handlePostCreated = () => {
        router.reload();
    };

    const handlePostDeleted = (postId: number) => {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        setStats((prev) => ({ ...prev, posts_count: prev.posts_count - 1 }));
    };

    const loadMore = useCallback(async () => {
        if (currentPage >= lastPage || isLoadingMore) return;

        setIsLoadingMore(true);
        try {
            const result = await socialApi.getUserPosts(
                profileUser.id,
                currentPage + 1,
            );
            setPosts((prev) => [...prev, ...result.data]);
            setCurrentPage(result.current_page);
            setLastPage(result.last_page);
        } catch {
            // Error handling
        } finally {
            setIsLoadingMore(false);
        }
    }, [currentPage, lastPage, isLoadingMore, profileUser.id]);

    const handleSaveBio = async () => {
        setIsSavingBio(true);
        try {
            await socialApi.updateProfile({ bio: editBio });
            setIsEditingBio(false);
            router.reload();
        } catch {
            // Error handling
        } finally {
            setIsSavingBio(false);
        }
    };

    const joinDate = new Date(profileUser.created_at).toLocaleDateString(
        "en-US",
        { month: "long", year: "numeric" },
    );

    const pageTitle = `${profileUser.name} (@${profileUser.username}) - LEGO Builder Profile | BrickOasis`;
    const pageDescription = profileUser.bio
        ? `${profileUser.bio} - ${stats.posts_count} builds, ${stats.followers_count} followers. View ${profileUser.name}'s LEGO creations on BrickOasis.`
        : `${profileUser.name}'s LEGO builder profile. ${stats.posts_count} builds, ${stats.followers_count} followers, ${stats.following_count} following. Member since ${joinDate}.`;

    return (
        <div className="min-h-screen bg-gray-900">
            <Head>
                <title>{pageTitle}</title>
                <meta name="description" content={pageDescription} />
                <meta
                    name="keywords"
                    content={`${profileUser.name}, LEGO builder, @${profileUser.username}, LEGO profile, builder community`}
                />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={pageDescription} />
                <meta property="og:type" content="profile" />
                {profileUser.avatar && (
                    <meta property="og:image" content={profileUser.avatar} />
                )}
                <link
                    rel="canonical"
                    href={`${window.location.origin}/u/${profileUser.username}`}
                />
            </Head>

            <Header />

            {/* Profile Header */}
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 border-b border-gray-700">
                <div className="max-w-4xl mx-auto px-4 pt-24 pb-8">
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                        {/* Avatar */}
                        <div className="shrink-0">
                            {profileUser.avatar ? (
                                <img
                                    src={profileUser.avatar}
                                    alt={profileUser.name}
                                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover ring-4 ring-gray-700 shadow-xl"
                                />
                            ) : (
                                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center ring-4 ring-gray-700 shadow-xl">
                                    <span className="text-3xl sm:text-4xl font-bold text-white">
                                        {profileUser.name
                                            ?.charAt(0)
                                            .toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                                        {profileUser.name}
                                    </h1>
                                    <p className="text-gray-400 text-sm mt-0.5">
                                        @{profileUser.username}
                                    </p>
                                </div>

                                {!isSelf && user && (
                                    <FollowButton
                                        userId={profileUser.id}
                                        isFollowing={initialIsFollowing}
                                        followersCount={stats.followers_count}
                                        onFollowChange={handleFollowChange}
                                    />
                                )}

                                {isSelf && (
                                    <Link
                                        href="/dashboard/settings"
                                        className="px-4 py-2 text-sm bg-gray-700/50 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        Edit Profile
                                    </Link>
                                )}
                            </div>

                            {/* Bio */}
                            <div className="mt-3">
                                {isEditingBio ? (
                                    <div>
                                        <textarea
                                            value={editBio}
                                            onChange={(e) =>
                                                setEditBio(e.target.value)
                                            }
                                            maxLength={500}
                                            rows={3}
                                            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-yellow-500/50 outline-none resize-none"
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button
                                                onClick={() =>
                                                    setIsEditingBio(false)
                                                }
                                                className="px-3 py-1 text-sm text-gray-400"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveBio}
                                                disabled={isSavingBio}
                                                className="px-3 py-1 text-sm bg-yellow-500 text-gray-900 rounded-lg font-semibold disabled:opacity-50"
                                            >
                                                {isSavingBio
                                                    ? "Saving..."
                                                    : "Save"}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        {profileUser.bio ? (
                                            <p className="text-gray-300 text-sm leading-relaxed">
                                                {profileUser.bio}
                                            </p>
                                        ) : isSelf ? (
                                            <button
                                                onClick={() =>
                                                    setIsEditingBio(true)
                                                }
                                                className="text-gray-500 text-sm hover:text-gray-400 transition-colors"
                                            >
                                                + Add a bio
                                            </button>
                                        ) : null}
                                    </div>
                                )}
                            </div>

                            {/* Stats Row */}
                            <div className="flex items-center gap-6 mt-4">
                                <div className="text-center">
                                    <span className="text-white font-bold text-lg">
                                        {stats.posts_count}
                                    </span>
                                    <span className="text-gray-400 text-sm ml-1">
                                        posts
                                    </span>
                                </div>
                                <div className="text-center">
                                    <span className="text-white font-bold text-lg">
                                        {stats.followers_count}
                                    </span>
                                    <span className="text-gray-400 text-sm ml-1">
                                        followers
                                    </span>
                                </div>
                                <div className="text-center">
                                    <span className="text-white font-bold text-lg">
                                        {stats.following_count}
                                    </span>
                                    <span className="text-gray-400 text-sm ml-1">
                                        following
                                    </span>
                                </div>
                                <div className="text-center">
                                    <span className="text-white font-bold text-lg">
                                        {stats.mocs_count}
                                    </span>
                                    <span className="text-gray-400 text-sm ml-1">
                                        MOCs
                                    </span>
                                </div>
                            </div>

                            {/* Joined Date */}
                            <div className="flex items-center gap-1.5 mt-3 text-gray-500 text-sm">
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
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                Joined {joinDate}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="border-b border-gray-700 bg-gray-900/50 sticky top-16 z-10 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto px-4">
                    <nav className="flex gap-0">
                        <button
                            onClick={() => setActiveTab("builds")}
                            className={`px-6 py-3.5 text-sm font-medium transition-colors relative ${
                                activeTab === "builds"
                                    ? "text-yellow-400"
                                    : "text-gray-400 hover:text-gray-300"
                            }`}
                        >
                            Builds
                            {activeTab === "builds" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("about")}
                            className={`px-6 py-3.5 text-sm font-medium transition-colors relative ${
                                activeTab === "about"
                                    ? "text-yellow-400"
                                    : "text-gray-400 hover:text-gray-300"
                            }`}
                        >
                            About
                            {activeTab === "about" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400" />
                            )}
                        </button>
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-2xl mx-auto px-4 py-8">
                {activeTab === "builds" && (
                    <>
                        {/* Create Post (only on own profile) */}
                        {isSelf && (
                            <div className="mb-6">
                                <CreatePostForm
                                    onPostCreated={handlePostCreated}
                                />
                            </div>
                        )}

                        {/* Posts */}
                        {posts.length > 0 ? (
                            <div className="space-y-6">
                                {posts.map((post) => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        onPostDeleted={handlePostDeleted}
                                    />
                                ))}

                                {currentPage < lastPage && (
                                    <div className="flex justify-center py-4">
                                        <button
                                            onClick={loadMore}
                                            disabled={isLoadingMore}
                                            className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {isLoadingMore
                                                ? "Loading..."
                                                : "Load more"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                                    <svg
                                        className="w-8 h-8 text-gray-600"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-1">
                                    No builds yet
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    {isSelf
                                        ? "Share your first LEGO build with the community!"
                                        : `${profileUser.name} hasn't shared any builds yet.`}
                                </p>
                            </div>
                        )}
                    </>
                )}

                {activeTab === "about" && (
                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                        <h3 className="text-white font-semibold mb-4">
                            About {profileUser.name}
                        </h3>

                        {profileUser.bio ? (
                            <p className="text-gray-300 text-sm leading-relaxed mb-6 whitespace-pre-line">
                                {profileUser.bio}
                            </p>
                        ) : (
                            <p className="text-gray-500 text-sm mb-6">
                                No bio yet.
                            </p>
                        )}

                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-3 text-gray-400">
                                <svg
                                    className="w-4 h-4 shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                <span>Joined {joinDate}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-400">
                                <svg
                                    className="w-4 h-4 shrink-0"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                                <span>{stats.posts_count} builds shared</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-400">
                                <svg
                                    className="w-4 h-4 shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                    />
                                </svg>
                                <span>{stats.mocs_count} MOCs created</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
