import { socialApi } from "../../api";
import { useAuth } from "../../contexts/AuthContext";
import { useState } from "react";

interface FollowButtonProps {
    userId: number;
    isFollowing: boolean;
    followersCount?: number;
    onFollowChange?: (isFollowing: boolean, followersCount: number) => void;
    size?: "sm" | "md";
}

export default function FollowButton({
    userId,
    isFollowing: initialIsFollowing,
    followersCount: initialCount,
    onFollowChange,
    size = "md",
}: FollowButtonProps) {
    const { user } = useAuth();
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [, setFollowersCount] = useState(initialCount ?? 0);
    const [isLoading, setIsLoading] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    if (!user || user.id === userId) return null;

    const handleClick = async () => {
        setIsLoading(true);
        try {
            if (isFollowing) {
                const result = await socialApi.unfollowUser(userId);
                setIsFollowing(false);
                setFollowersCount(result.followers_count);
                onFollowChange?.(false, result.followers_count);
            } else {
                const result = await socialApi.followUser(userId);
                setIsFollowing(true);
                setFollowersCount(result.followers_count);
                onFollowChange?.(true, result.followers_count);
            }
        } catch {
            // Revert on error
        } finally {
            setIsLoading(false);
        }
    };

    const sizeClasses =
        size === "sm" ? "px-3 py-1 text-xs" : "px-5 py-2 text-sm";

    if (isFollowing) {
        return (
            <button
                onClick={handleClick}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                disabled={isLoading}
                className={`${sizeClasses} font-semibold rounded-lg transition-all border disabled:opacity-50 ${
                    isHovering
                        ? "bg-red-600/10 border-red-500/50 text-red-400"
                        : "bg-gray-700/50 border-gray-600 text-gray-300"
                }`}
            >
                {isHovering ? "Unfollow" : "Following"}
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            disabled={isLoading}
            className={`${sizeClasses} bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors disabled:opacity-50`}
        >
            {isLoading ? "..." : "Follow"}
        </button>
    );
}
