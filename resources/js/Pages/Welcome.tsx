import React, { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { useAuth } from "../contexts/AuthContext";
import AuthModal from "../components/AuthModal";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { mocUrl, catalogSetUrl, catalogThemeUrl } from "../utils/seoUrls";

interface Stats {
    total_models: number;
    total_parts: number;
    total_users: number;
    free_models: number;
    paid_models: number;
    total_sets: number;
    total_themes: number;
    total_colors: number;
    total_unique_parts: number;
}

interface FunStats {
    largest_set: {
        name: string;
        set_num: string;
        num_parts: number;
    } | null;
    oldest_set_year: number | null;
    newest_set_year: number | null;
}

interface PopularTheme {
    id: number;
    name: string;
    sets_count: number;
}

interface PopularSet {
    set_num: string;
    name: string;
    year: number;
    num_parts: number;
    theme: string | null;
    image_url: string;
}

interface FeaturedModel {
    id: number;
    name: string;
    thumbnail: string | null;
    total_parts: number;
    total_steps: number;
    price: number | null;
    user: { name: string } | null;
}

interface WelcomeProps {
    stats: Stats;
    funStats: FunStats;
    popularThemes: PopularTheme[];
    popularSets: PopularSet[];
    featuredModels: FeaturedModel[];
}

export default function Welcome({
    stats,
    funStats,
    popularThemes,
    popularSets,
    featuredModels,
}: WelcomeProps) {
    const { isAuthenticated } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);

    return (
        <>
            <Head>
                <title>
                    BrickOasis - 3D LEGO LDraw Viewer, Building Instructions &
                    MOC Marketplace
                </title>
                <meta
                    name="description"
                    content="Explore, view, and share LEGO LDraw models with our advanced 3D viewer featuring step-by-step building instructions. Discover thousands of MOCs, track your LEGO investments, and join a thriving builder community."
                />
                <meta
                    name="keywords"
                    content="LEGO, LDraw, 3D viewer, MOC, building instructions, LEGO marketplace, LEGO flipping, LEGO sets, custom builds"
                />
                <meta
                    property="og:title"
                    content="BrickOasis - 3D LEGO LDraw Viewer & MOC Marketplace"
                />
                <meta
                    property="og:description"
                    content="View LEGO LDraw models in stunning 3D with step-by-step instructions. Browse thousands of MOCs and manage your LEGO collection."
                />
                <meta property="og:type" content="website" />
                <link rel="canonical" href={window.location.origin} />
            </Head>

            <div className="min-h-screen bg-linear-to-b from-gray-900 via-gray-800 to-gray-900">
                <Header
                    onOpenAuthModal={() => setShowAuthModal(true)}
                    currentPage="home"
                />

                {/* Hero Section */}
                <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-yellow-400 via-orange-500 to-red-500 mb-6 leading-tight">
                                Build, View & Share
                                <br />
                                Your LEGO Dreams
                            </h1>
                            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-4">
                                The ultimate platform for LEGO enthusiasts.
                                Explore thousands of LDraw models with our
                                powerful 3D viewer, discover step-by-step
                                building instructions, and manage your LEGO
                                investment portfolio.
                            </p>
                            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
                                Join {stats.total_users.toLocaleString()}{" "}
                                builders exploring{" "}
                                {stats.total_sets.toLocaleString()} official
                                LEGO sets and{" "}
                                {stats.total_models.toLocaleString()} custom
                                MOCs powered by Three.js technology.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                            <Link
                                href="/catalog"
                                className="px-8 py-4 bg-linear-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 font-bold text-lg rounded-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-yellow-500/25"
                            >
                                Browse {stats.total_sets.toLocaleString()} Sets
                            </Link>
                            <Link
                                href="/store"
                                className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg rounded-xl transition-all border border-gray-600"
                            >
                                Explore MOCs
                            </Link>
                            <Link
                                href="/viewer"
                                className="px-8 py-4 bg-transparent hover:bg-gray-800 text-yellow-400 font-semibold text-lg rounded-xl transition-all border-2 border-yellow-500/50 hover:border-yellow-400"
                            >
                                Try 3D Viewer
                            </Link>
                        </div>

                        {/* Trust Indicators */}
                        <div className="flex flex-wrap items-center justify-center gap-8 text-gray-400 text-sm">
                            <div className="flex items-center gap-2">
                                <svg
                                    className="w-5 h-5 text-green-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span>100% Free Viewer</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg
                                    className="w-5 h-5 text-green-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span>.ldr & .mpd Compatible</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg
                                    className="w-5 h-5 text-green-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span>
                                    {stats.free_models.toLocaleString()} Free
                                    MOCs
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                                The Numbers Speak for Themselves
                            </h2>
                            <p className="text-gray-400 text-lg">
                                Join the world's most comprehensive LEGO
                                database
                            </p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            <div className="bg-gray-800/80 rounded-xl p-6 text-center border border-gray-700 hover:border-yellow-500/50 transition-all">
                                <div className="text-4xl md:text-5xl font-bold text-yellow-400 mb-2">
                                    {stats.total_sets.toLocaleString()}
                                </div>
                                <div className="text-gray-400 text-sm">
                                    Official Sets
                                </div>
                            </div>
                            <div className="bg-gray-800/80 rounded-xl p-6 text-center border border-gray-700 hover:border-orange-500/50 transition-all">
                                <div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">
                                    {stats.total_models.toLocaleString()}
                                </div>
                                <div className="text-gray-400 text-sm">
                                    Custom MOCs
                                </div>
                            </div>
                            <div className="bg-gray-800/80 rounded-xl p-6 text-center border border-gray-700 hover:border-blue-500/50 transition-all">
                                <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-2">
                                    {stats.total_unique_parts.toLocaleString()}
                                </div>
                                <div className="text-gray-400 text-sm">
                                    Unique Parts
                                </div>
                            </div>
                            <div className="bg-gray-800/80 rounded-xl p-6 text-center border border-gray-700 hover:border-purple-500/50 transition-all">
                                <div className="text-4xl md:text-5xl font-bold text-purple-400 mb-2">
                                    {stats.total_themes.toLocaleString()}
                                </div>
                                <div className="text-gray-400 text-sm">
                                    Themes
                                </div>
                            </div>
                            <div className="bg-gray-800/80 rounded-xl p-6 text-center border border-gray-700 hover:border-pink-500/50 transition-all">
                                <div className="text-4xl md:text-5xl font-bold text-pink-400 mb-2">
                                    {stats.total_colors.toLocaleString()}
                                </div>
                                <div className="text-gray-400 text-sm">
                                    LEGO Colors
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Fun Stats Section */}
                {funStats.largest_set && (
                    <section className="py-16 px-4 sm:px-6 lg:px-8">
                        <div className="max-w-7xl mx-auto">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                                    Did You Know?
                                </h2>
                                <p className="text-gray-400 text-lg">
                                    Fun facts from our LEGO database
                                </p>
                            </div>
                            <div className="grid md:grid-cols-3 gap-8">
                                {funStats.largest_set && (
                                    <div className="bg-linear-to-br from-yellow-500/10 to-orange-500/10 rounded-xl p-8 border border-yellow-500/30">
                                        <div className="text-6xl mb-4">🏆</div>
                                        <h3 className="text-xl font-bold text-yellow-400 mb-2">
                                            Largest Set
                                        </h3>
                                        <p className="text-gray-300 font-semibold mb-1">
                                            {funStats.largest_set.name}
                                        </p>
                                        <p className="text-gray-400 text-sm mb-2">
                                            {funStats.largest_set.set_num}
                                        </p>
                                        <p className="text-3xl font-bold text-white">
                                            {funStats.largest_set.num_parts.toLocaleString()}{" "}
                                            <span className="text-lg text-gray-400">
                                                pieces
                                            </span>
                                        </p>
                                    </div>
                                )}
                                {funStats.oldest_set_year && (
                                    <div className="bg-linear-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-8 border border-blue-500/30">
                                        <div className="text-6xl mb-4">📜</div>
                                        <h3 className="text-xl font-bold text-blue-400 mb-2">
                                            LEGO History
                                        </h3>
                                        <p className="text-gray-300 mb-2">
                                            Our database spans from
                                        </p>
                                        <p className="text-3xl font-bold text-white">
                                            {funStats.oldest_set_year}
                                            <span className="text-lg text-gray-400 mx-2">
                                                to
                                            </span>
                                            {funStats.newest_set_year}
                                        </p>
                                        <p className="text-gray-400 text-sm mt-2">
                                            {funStats.newest_set_year! -
                                                funStats.oldest_set_year}{" "}
                                            years of building!
                                        </p>
                                    </div>
                                )}
                                <div className="bg-linear-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-8 border border-green-500/30">
                                    <div className="text-6xl mb-4">🎨</div>
                                    <h3 className="text-xl font-bold text-green-400 mb-2">
                                        Color Palette
                                    </h3>
                                    <p className="text-gray-300 mb-2">
                                        LEGO has produced bricks in
                                    </p>
                                    <p className="text-3xl font-bold text-white">
                                        {stats.total_colors}
                                        <span className="text-lg text-gray-400 ml-2">
                                            colors
                                        </span>
                                    </p>
                                    <p className="text-gray-400 text-sm mt-2">
                                        From classic red to rare metallics
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Popular Themes */}
                {popularThemes.length > 0 && (
                    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/30">
                        <div className="max-w-7xl mx-auto">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                                    Most Popular Themes
                                </h2>
                                <p className="text-gray-400 text-lg">
                                    Explore the biggest LEGO collections
                                </p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {popularThemes.map((theme) => (
                                    <Link
                                        key={theme.id}
                                        href={catalogThemeUrl(theme)}
                                        className="group bg-gray-800 rounded-xl p-6 text-center border border-gray-700 hover:border-yellow-500/50 transition-all hover:shadow-lg hover:shadow-yellow-500/10 hover:-translate-y-1"
                                    >
                                        <h3 className="text-white font-semibold mb-2 group-hover:text-yellow-400 transition-colors">
                                            {theme.name}
                                        </h3>
                                        <p className="text-2xl font-bold text-yellow-400">
                                            {theme.sets_count}
                                        </p>
                                        <p className="text-gray-400 text-sm">
                                            sets
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Popular Sets */}
                {popularSets.length > 0 && (
                    <section className="py-16 px-4 sm:px-6 lg:px-8">
                        <div className="max-w-7xl mx-auto">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                                    Epic Building Challenges
                                </h2>
                                <p className="text-gray-400 text-lg">
                                    The biggest and most impressive recent sets
                                </p>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {popularSets.map((set) => (
                                    <Link
                                        key={set.set_num}
                                        href={catalogSetUrl(set)}
                                        className="group bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-1"
                                    >
                                        <div className="aspect-video bg-gray-700 relative overflow-hidden">
                                            <img
                                                src={set.image_url}
                                                alt={set.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                onError={(e) => {
                                                    const target =
                                                        e.currentTarget;
                                                    target.style.display =
                                                        "none";
                                                    target.parentElement!.innerHTML = `
                                                        <div class="w-full h-full flex items-center justify-center">
                                                            <svg class="w-16 h-16 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                                            </svg>
                                                        </div>
                                                    `;
                                                }}
                                            />
                                            <div className="absolute top-3 right-3 px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-lg shadow-lg">
                                                {set.num_parts.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="p-5">
                                            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-400 transition-colors line-clamp-2">
                                                {set.name}
                                            </h3>
                                            <div className="flex items-center justify-between text-sm mb-2">
                                                <span className="text-gray-400">
                                                    {set.set_num}
                                                </span>
                                                <span className="text-gray-500">
                                                    {set.year}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                {set.theme}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            <div className="text-center mt-8">
                                <Link
                                    href="/catalog"
                                    className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 font-semibold transition-colors"
                                >
                                    Browse All Sets
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
                )}

                {/* Featured Models */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800/30">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                Community Creations
                            </h2>
                            <p className="text-gray-400 text-lg">
                                Amazing custom MOCs from talented builders
                                worldwide
                            </p>
                        </div>

                        {featuredModels.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {featuredModels.map((model) => (
                                        <Link
                                            key={model.id}
                                            href={mocUrl(model)}
                                            className="group bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-yellow-500/50 transition-all hover:shadow-lg hover:shadow-yellow-500/10 hover:-translate-y-1"
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
                                                    <span className="absolute top-3 right-3 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-lg shadow-lg">
                                                        FREE
                                                    </span>
                                                ) : (
                                                    <span className="absolute top-3 right-3 px-3 py-1 bg-yellow-500 text-gray-900 text-xs font-bold rounded-lg shadow-lg">
                                                        $
                                                        {Number(
                                                            model.price,
                                                        ).toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="p-5">
                                                <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-yellow-400 transition-colors line-clamp-1">
                                                    {model.name}
                                                </h3>
                                                <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                                                    <span className="flex items-center gap-1">
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                                        </svg>
                                                        {model.total_parts}{" "}
                                                        parts
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <svg
                                                            className="w-4 h-4"
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                        {model.total_steps}{" "}
                                                        steps
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    by{" "}
                                                    {model.user?.name ||
                                                        "Anonymous"}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                <div className="text-center mt-12">
                                    <Link
                                        href="/store"
                                        className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 font-semibold text-lg transition-colors"
                                    >
                                        Explore All MOCs
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
                            </>
                        ) : (
                            <div className="text-center text-gray-400 py-12">
                                <p>
                                    No featured models yet. Be the first to
                                    share your creation!
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                Powerful Tools for Every Builder
                            </h2>
                            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
                                Whether you're building, collecting, or
                                investing in LEGO, we've got the perfect tools
                                for you
                            </p>
                        </div>

                        {/* Main Features */}
                        <div className="grid lg:grid-cols-2 gap-8 mb-8">
                            {/* 3D Viewer Feature */}
                            <div className="bg-linear-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl p-8 border border-yellow-500/30 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl"></div>
                                <div className="relative z-10">
                                    <div className="w-16 h-16 bg-linear-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                                        <svg
                                            className="w-8 h-8 text-white"
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
                                    <h3 className="text-2xl font-bold text-white mb-4">
                                        Advanced 3D LDraw Viewer
                                    </h3>
                                    <p className="text-gray-300 mb-6 leading-relaxed">
                                        Experience LEGO models like never before
                                        with our cutting-edge Three.js powered
                                        viewer. Navigate through step-by-step
                                        building instructions, rotate models in
                                        real-time, and explore every detail in
                                        stunning 3D.
                                    </p>
                                    <ul className="space-y-3 mb-6">
                                        <li className="flex items-start gap-3 text-gray-300">
                                            <svg
                                                className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            <span>
                                                Step-by-step building
                                                instructions with visual
                                                guidance
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3 text-gray-300">
                                            <svg
                                                className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            <span>
                                                Full 360° rotation and zoom
                                                controls
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3 text-gray-300">
                                            <svg
                                                className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            <span>
                                                Native .ldr and .mpd file format
                                                support
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3 text-gray-300">
                                            <svg
                                                className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            <span>
                                                Real LEGO colors and authentic
                                                part rendering
                                            </span>
                                        </li>
                                    </ul>
                                    <Link
                                        href="/viewer"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 font-bold rounded-xl transition-all"
                                    >
                                        Try Viewer Now
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

                            {/* Flipping Tracker Feature */}
                            <div className="bg-linear-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-8 border border-green-500/30 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl"></div>
                                <div className="relative z-10">
                                    <div className="w-16 h-16 bg-linear-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                                        <svg
                                            className="w-8 h-8 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-4">
                                        LEGO Flipping Tracker
                                    </h3>
                                    <p className="text-gray-300 mb-6 leading-relaxed">
                                        Turn your LEGO hobby into profit. Track
                                        purchases, sales, and profit margins
                                        with precision. Perfect for resellers
                                        and investors who want to maximize their
                                        returns.
                                    </p>
                                    <ul className="space-y-3 mb-6">
                                        <li className="flex items-start gap-3 text-gray-300">
                                            <svg
                                                className="w-5 h-5 text-green-400 mt-0.5 shrink-0"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            <span>
                                                Track buy/sell prices and
                                                automatic profit calculation
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3 text-gray-300">
                                            <svg
                                                className="w-5 h-5 text-green-400 mt-0.5 shrink-0"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            <span>
                                                Multi-currency support with
                                                customizable symbols
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3 text-gray-300">
                                            <svg
                                                className="w-5 h-5 text-green-400 mt-0.5 shrink-0"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            <span>
                                                Detailed transaction history and
                                                notes
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-3 text-gray-300">
                                            <svg
                                                className="w-5 h-5 text-green-400 mt-0.5 shrink-0"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            <span>
                                                Visual analytics and performance
                                                insights
                                            </span>
                                        </li>
                                    </ul>
                                    <Link
                                        href="/flipping"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-xl transition-all"
                                    >
                                        Start Tracking
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
                        </div>

                        {/* Additional Features */}
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-500/50 transition-all">
                                <div className="w-12 h-12 bg-linear-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                                    <svg
                                        className="w-6 h-6 text-white"
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
                                <h3 className="text-xl font-bold text-white mb-2">
                                    Easy Upload & Share
                                </h3>
                                <p className="text-gray-400">
                                    Upload your LDraw creations and share them
                                    with the community. Set pricing for premium
                                    models or offer them free.
                                </p>
                            </div>

                            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500/50 transition-all">
                                <div className="w-12 h-12 bg-linear-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                                    <svg
                                        className="w-6 h-6 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">
                                    Comprehensive Catalog
                                </h3>
                                <p className="text-gray-400">
                                    Browse {stats.total_sets.toLocaleString()}{" "}
                                    official LEGO sets with detailed part
                                    inventories and theme organization.
                                </p>
                            </div>

                            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-orange-500/50 transition-all">
                                <div className="w-12 h-12 bg-linear-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center mb-4">
                                    <svg
                                        className="w-6 h-6 text-white"
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
                                <h3 className="text-xl font-bold text-white mb-2">
                                    Thriving Community
                                </h3>
                                <p className="text-gray-400">
                                    Connect with builders, collectors, and
                                    investors. Share tips, discover trends, and
                                    grow together.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>
                    <div className="max-w-4xl mx-auto text-center relative z-10">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            Ready to Elevate Your LEGO Experience?
                        </h2>
                        <p className="text-gray-300 text-xl mb-4">
                            Join {stats.total_users.toLocaleString()} builders
                            who are already using BrickOasis
                        </p>
                        <p className="text-gray-400 mb-10 max-w-2xl mx-auto">
                            Get instant access to{" "}
                            {stats.free_models.toLocaleString()} free MOCs, our
                            powerful 3D viewer, and professional flipping
                            tools—all completely free to start.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            {!isAuthenticated ? (
                                <>
                                    <button
                                        onClick={() => setShowAuthModal(true)}
                                        className="px-10 py-5 bg-linear-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 font-bold text-lg rounded-xl transition-all transform hover:scale-105 shadow-xl hover:shadow-yellow-500/30"
                                    >
                                        Get Started Free
                                    </button>
                                    <Link
                                        href="/catalog"
                                        className="px-10 py-5 bg-gray-800 hover:bg-gray-700 text-white font-semibold text-lg rounded-xl transition-all border border-gray-600"
                                    >
                                        Explore Catalog
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/store"
                                        className="px-10 py-5 bg-linear-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 font-bold text-lg rounded-xl transition-all transform hover:scale-105"
                                    >
                                        Browse MOCs
                                    </Link>
                                    <Link
                                        href="/flipping"
                                        className="px-10 py-5 bg-gray-800 hover:bg-gray-700 text-white font-semibold text-lg rounded-xl transition-all border border-gray-600"
                                    >
                                        Start Flipping
                                    </Link>
                                </>
                            )}
                        </div>
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                                <svg
                                    className="w-5 h-5 text-green-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span>No credit card required</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg
                                    className="w-5 h-5 text-green-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span>Free forever plan</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg
                                    className="w-5 h-5 text-green-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span>Access all features</span>
                            </div>
                        </div>
                    </div>
                </section>

                <Footer />

                {/* Auth Modal */}
                <AuthModal
                    isOpen={showAuthModal}
                    onClose={() => setShowAuthModal(false)}
                />
            </div>
        </>
    );
}
