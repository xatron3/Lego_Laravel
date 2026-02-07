import { useState, useRef, useEffect, useCallback } from "react";
import { Link, usePage } from "@inertiajs/react";
import { socialApi, NotificationData } from "../api";

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

function notificationIcon(type: NotificationData["type"]) {
    switch (type) {
        case "new_follower":
            return (
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <svg
                        className="w-4 h-4 text-blue-400"
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
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                    <svg
                        className="w-4 h-4 text-red-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                    </svg>
                </div>
            );
        case "post_comment":
            return (
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
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
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                </div>
            );
        case "moc_sale":
            return (
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                    <svg
                        className="w-4 h-4 text-yellow-400"
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

export default function NotificationBell() {
    const { notifications: sharedNotifications } = usePage<{
        notifications: { unreadCount: number };
    }>().props;

    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(
        sharedNotifications?.unreadCount ?? 0,
    );
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sync with Inertia shared props on page navigation
    useEffect(() => {
        setUnreadCount(sharedNotifications?.unreadCount ?? 0);
    }, [sharedNotifications?.unreadCount]);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const data = await socialApi.getNotifications(1);
            setNotifications(data.data.slice(0, 8));
        } catch {
            // Silently fail
        } finally {
            setLoading(false);
        }
    }, []);

    const handleOpen = useCallback(async () => {
        setIsOpen(true);
        await fetchNotifications();

        // Mark as seen
        if (unreadCount > 0) {
            try {
                await socialApi.markNotificationsSeen();
                setUnreadCount(0);
            } catch {
                // Silently fail
            }
        }
    }, [fetchNotifications, unreadCount]);

    const handleToggle = useCallback(() => {
        if (isOpen) {
            setIsOpen(false);
        } else {
            handleOpen();
        }
    }, [isOpen, handleOpen]);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={handleToggle}
                className="relative p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Notifications"
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-slideDown z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                        <h3 className="text-white font-semibold">
                            Notifications
                        </h3>
                        <Link
                            href="/dashboard/notifications"
                            className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            View all
                        </Link>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-8 text-center">
                                <svg
                                    className="w-10 h-10 text-gray-600 mx-auto mb-2"
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
                                <p className="text-gray-400 text-sm">
                                    No notifications yet
                                </p>
                            </div>
                        ) : (
                            notifications.map((notification) => {
                                const link = getNotificationLink(notification);
                                const content = (
                                    <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-700/50 transition-colors cursor-pointer">
                                        {notificationIcon(notification.type)}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-200 leading-snug">
                                                {notification.data?.message ??
                                                    "You have a new notification."}
                                            </p>
                                            {notification.data
                                                ?.comment_preview && (
                                                <p className="text-xs text-gray-400 mt-1 truncate">
                                                    &ldquo;
                                                    {
                                                        notification.data
                                                            .comment_preview
                                                    }
                                                    &rdquo;
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                                {timeAgo(
                                                    notification.created_at,
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                );

                                return link ? (
                                    <Link
                                        key={notification.id}
                                        href={link}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {content}
                                    </Link>
                                ) : (
                                    <div key={notification.id}>{content}</div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="border-t border-gray-700">
                            <Link
                                href="/dashboard/notifications"
                                className="block text-center py-3 text-sm text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                See all notifications
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
