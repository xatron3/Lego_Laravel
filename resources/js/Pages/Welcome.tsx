import React, { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";
import { useAuth } from "../contexts/AuthContext";
import AuthModal from "../components/AuthModal";
import UserMenu from "../components/UserMenu";
import { api } from "../api";

interface Stats {
    total_models: number;
    total_parts: number;
    total_users: number;
    free_models: number;
    paid_models: number;
}

interface FeaturedModel {
    id: number;
    name: string;
    thumbnail: string | null;
    total_parts: number;
    total_steps: number;
    price: number | null;
    user: { name: string };
}

export default function Welcome() {
    const { isAuthenticated } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [stats, setStats] = useState<Stats>({
        total_models: 0,
        total_parts: 0,
        total_users: 0,
        free_models: 0,
        paid_models: 0,
    });
    const [featuredModels, setFeaturedModels] = useState<FeaturedModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStats();
        loadFeaturedModels();
    }, []);

    const loadStats = async () => {
        try {
            const data = await api.getStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to load stats:", error);
        }
    };

    const loadFeaturedModels = async () => {
        try {
            const data = await api.getStoreModels({ featured: true, limit: 6 });
            setFeaturedModels(data as FeaturedModel[]);
        } catch (error) {
            console.error("Failed to load featured models:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-6 h-6 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-white">
                                BrickVault
                            </span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-8">
                            <Link
                                href="/store"
                                className="text-gray-300 hover:text-white transition-colors"
                            >
                                Store
                            </Link>
                            <Link
                                href="/viewer"
                                className="text-gray-300 hover:text-white transition-colors"
                            >
                                Viewer
                            </Link>
                        </nav>

                        <div className="flex items-center gap-4">
                            {isAuthenticated ? (
                                <UserMenu />
                            ) : (
                                <button
                                    onClick={() => setShowAuthModal(true)}
                                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors"
                                >
                                    Sign In
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-6">
                        Build Amazing
                        <br />
                        LEGO Creations
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-10">
                        View, share, and discover incredible LDraw models.
                        Step-by-step building instructions powered by Three.js.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/store"
                            className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 font-bold text-lg rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-yellow-500/25"
                        >
                            Browse Models
                        </Link>
                        <Link
                            href="/viewer"
                            className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg rounded-xl transition-all border border-gray-600"
                        >
                            Try Viewer
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-yellow-400 mb-2">
                                {stats.total_models.toLocaleString()}
                            </div>
                            <div className="text-gray-400 text-lg">Models</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">
                                {stats.total_parts.toLocaleString()}
                            </div>
                            <div className="text-gray-400 text-lg">
                                Total Parts
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-red-400 mb-2">
                                {stats.total_users.toLocaleString()}
                            </div>
                            <div className="text-gray-400 text-lg">
                                Builders
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-green-400 mb-2">
                                {stats.free_models.toLocaleString()}
                            </div>
                            <div className="text-gray-400 text-lg">
                                Free Models
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Models */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Featured Models
                        </h2>
                        <p className="text-gray-400 text-lg">
                            Discover amazing creations from our community
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
                        </div>
                    ) : featuredModels.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {featuredModels.map((model) => (
                                <Link
                                    key={model.id}
                                    href={`/model/${model.id}`}
                                    className="group bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-yellow-500/50 transition-all hover:shadow-lg hover:shadow-yellow-500/10"
                                >
                                    <div className="aspect-video bg-gray-700 relative overflow-hidden">
                                        {model.thumbnail ? (
                                            <img
                                                src={model.thumbnail}
                                                alt={model.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <svg
                                                    className="w-16 h-16 text-gray-600"
                                                    fill="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                                </svg>
                                            </div>
                                        )}
                                        {model.price === null ||
                                        model.price === 0 ? (
                                            <span className="absolute top-3 right-3 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
                                                FREE
                                            </span>
                                        ) : (
                                            <span className="absolute top-3 right-3 px-2 py-1 bg-yellow-500 text-gray-900 text-xs font-bold rounded">
                                                $
                                                {Number(model.price).toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                                            {model.name}
                                        </h3>
                                        <div className="flex items-center justify-between text-sm text-gray-400">
                                            <span>
                                                {model.total_parts} parts
                                            </span>
                                            <span>
                                                {model.total_steps} steps
                                            </span>
                                        </div>
                                        <div className="mt-2 text-sm text-gray-500">
                                            by {model.user?.name || "Anonymous"}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 py-12">
                            <p>
                                No featured models yet. Be the first to share
                                your creation!
                            </p>
                        </div>
                    )}

                    <div className="text-center mt-12">
                        <Link
                            href="/store"
                            className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 font-semibold text-lg transition-colors"
                        >
                            View All Models
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
                                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                                />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800/30">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            Everything You Need
                        </h2>
                        <p className="text-gray-400 text-lg">
                            Powerful tools for viewing and sharing LDraw models
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
                            <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mb-6">
                                <svg
                                    className="w-7 h-7 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">
                                3D Viewer
                            </h3>
                            <p className="text-gray-400">
                                Interactive 3D viewer with step-by-step building
                                instructions. Rotate, zoom, and explore every
                                detail.
                            </p>
                        </div>

                        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
                            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mb-6">
                                <svg
                                    className="w-7 h-7 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">
                                Easy Upload
                            </h3>
                            <p className="text-gray-400">
                                Upload your LDraw files and share them with the
                                community. Support for .ldr and .mpd formats.
                            </p>
                        </div>

                        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mb-6">
                                <svg
                                    className="w-7 h-7 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">
                                Community
                            </h3>
                            <p className="text-gray-400">
                                Join a community of builders. Share your
                                creations and discover amazing models from
                                others.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Ready to Start Building?
                    </h2>
                    <p className="text-gray-400 text-lg mb-8">
                        Join thousands of builders and start exploring amazing
                        LEGO creations today.
                    </p>
                    {!isAuthenticated && (
                        <button
                            onClick={() => setShowAuthModal(true)}
                            className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 font-bold text-lg rounded-xl transition-all transform hover:scale-105"
                        >
                            Create Free Account
                        </button>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
                <div className="max-w-7xl mx-auto text-center text-gray-500">
                    <p>
                        © 2026 BrickVault. Built with ❤️ for LEGO enthusiasts.
                    </p>
                </div>
            </footer>

            {/* Auth Modal */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />
        </div>
    );
}
