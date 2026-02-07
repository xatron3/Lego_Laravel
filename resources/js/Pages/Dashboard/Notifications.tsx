import { useState, useEffect, useCallback } from "react";
import { Link, Head } from "@inertiajs/react";
import DashboardLayout from "../../components/DashboardLayout";
import { socialApi, NotificationData, NotificationType } from "../../api";

function timeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
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

function notificationIcon(type: NotificationType) {
    switch (type) {
        case "new_follower":
            return (
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <svg
                        className="w-5 h-5 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                        />
                    </svg>
                </div>
            );
        case "post_like":
            return (
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                    <svg
                        className="w-5 h-5 text-red-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                    </svg>
                </div>
            );
        case "post_comment":
            return (
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <svg
                        className="w-5 h-5 text-green-400"
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
                </div>
            );
        case "moc_sale":
            return (
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                    <svg
                        className="w-5 h-5 text-yellow-400"
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
                </div>
            );
    }
}

function getNotificationLink(notification: NotificationData): string | null {
    switch (notification.type) {
        case "new_follower":
            return notification.actor?.username
                ? `/u/${notification.actor.username}`
                : null;
        case "post_like":
        case "post_comment":
            return notification.notifiable_id
                ? `/community/posts/${notification.notifiable_id}`
                : null;
        case "moc_sale":
            return "/dashboard/sales";
        default:
            return null;
    }
}

function typeLabel(type: NotificationType): string {
    switch (type) {
        case "new_follower":
            return "New Follower";
        case "post_like":
            return "Post Like";
        case "post_comment":
            return "Comment";
        case "moc_sale":
            return "Sale";
    }
}

export default function Notifications() {
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchNotifications = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const data = await socialApi.getNotifications(page);
            setNotifications(data.data);
            setCurrentPage(data.current_page);
            setLastPage(data.last_page);
            setTotal(data.total);
        } catch {
            // Silently fail
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications(1);

        // Mark as seen when visiting this page
        socialApi.markNotificationsSeen().catch(() => {});
    }, [fetchNotifications]);

    return (
        <DashboardLayout currentPage="notifications">
            <Head title="Notifications" />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            Notifications
                        </h1>
                        <p className="text-gray-400 mt-1">
                            {total} total notification{total !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>

                {/* Notification List */}
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="py-16 text-center">
                            <svg
                                className="w-16 h-16 text-gray-600 mx-auto mb-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-300">
                                No notifications yet
                            </h3>
                            <p className="text-gray-500 mt-1">
                                When someone follows you, likes your post, or
                                buys your MOC, you'll see it here.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-700/50">
                            {notifications.map((notification) => {
                                const link = getNotificationLink(notification);

                                const content = (
                                    <div className="flex items-start gap-4 px-5 py-4 hover:bg-gray-700/30 transition-colors">
                                        {/* Icon */}
                                        {notificationIcon(notification.type)}

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-200 leading-snug">
                                                        {notification.data
                                                            ?.message ??
                                                            "You have a new notification."}
                                                    </p>
                                                    {notification.data
                                                        ?.comment_preview && (
                                                        <p className="text-sm text-gray-400 mt-1">
                                                            &ldquo;
                                                            {
                                                                notification
                                                                    .data
                                                                    .comment_preview
                                                            }
                                                            &rdquo;
                                                        </p>
                                                    )}
                                                    {notification.data
                                                        ?.amount && (
                                                        <p className="text-sm text-yellow-400 font-medium mt-1">
                                                            $
                                                            {
                                                                notification
                                                                    .data.amount
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="text-xs text-gray-500">
                                                        {timeAgo(
                                                            notification.created_at,
                                                        )}
                                                    </span>
                                                    <div className="mt-1">
                                                        <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">
                                                            {typeLabel(
                                                                notification.type,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actor Info */}
                                            {notification.actor && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    {notification.actor
                                                        .avatar ? (
                                                        <img
                                                            src={
                                                                notification
                                                                    .actor
                                                                    .avatar
                                                            }
                                                            alt={
                                                                notification
                                                                    .actor.name
                                                            }
                                                            className="w-5 h-5 rounded-full"
                                                        />
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center">
                                                            <span className="text-xs text-gray-300">
                                                                {notification.actor.name
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <span className="text-xs text-gray-400">
                                                        {
                                                            notification.actor
                                                                .name
                                                        }
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Arrow */}
                                        {link && (
                                            <svg
                                                className="w-5 h-5 text-gray-500 shrink-0 mt-1"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 5l7 7-7 7"
                                                />
                                            </svg>
                                        )}
                                    </div>
                                );

                                return link ? (
                                    <Link
                                        key={notification.id}
                                        href={link}
                                        className="block"
                                    >
                                        {content}
                                    </Link>
                                ) : (
                                    <div key={notification.id}>{content}</div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {lastPage > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => fetchNotifications(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-sm rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-400">
                            Page {currentPage} of {lastPage}
                        </span>
                        <button
                            onClick={() => fetchNotifications(currentPage + 1)}
                            disabled={currentPage === lastPage}
                            className="px-4 py-2 text-sm rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
