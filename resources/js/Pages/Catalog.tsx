import { useState } from "react";
import { Link, Head } from "@inertiajs/react";
import Header from "../components/Header";
import AuthModal from "../components/AuthModal";
import Footer from "../components/Footer";
import CatalogNav from "../components/catalog/CatalogNav";
import SearchAutocomplete from "../components/catalog/SearchAutocomplete";
import SetCard from "../components/catalog/SetCard";
import { catalogThemeUrl, catalogSetUrl } from "../utils/seoUrls";

interface CatalogStats {
    sets: number;
    mocs: number;
    parts: number;
    minifigs: number;
    colors: number;
    themes: number;
}

interface CatalogSetItem {
    set_num: string;
    name: string;
    year: number;
    num_parts: number;
    image_url: string;
    theme?: { id: number; name: string } | null;
}

interface CatalogMocItem extends CatalogSetItem {
    total_steps?: number;
    price?: number | string | null;
    thumbnail?: string | null;
    user?: { id: number; name: string } | null;
}

interface CatalogThemeItem {
    id: number;
    name: string;
    sets_count: number;
}

interface CatalogProps {
    stats: CatalogStats;
    popularSets: CatalogSetItem[];
    popularMocs: CatalogMocItem[];
    latestMocs: CatalogMocItem[];
    latestSets: CatalogSetItem[];
    popularThemes: CatalogThemeItem[];
}

/**
 * Catalog discovery page - showcases popular sets, MOCs, themes,
 * and provides global search with autocomplete across all categories.
 */
export default function Catalog({
    stats,
    popularSets,
    popularMocs,
    latestMocs,
    latestSets,
    popularThemes,
}: CatalogProps) {
    const [showAuthModal, setShowAuthModal] = useState(false);

    return (
        <div className="min-h-screen bg-gray-900">
            <Head>
                <title>
                    LEGO Catalog - Browse Sets, Parts, Minifigs & MOCs |
                    BrickOasis
                </title>
                <meta
                    name="description"
                    content={`Explore our comprehensive LEGO catalog featuring ${stats.sets?.toLocaleString()} official sets, ${stats.mocs?.toLocaleString()} MOCs, ${stats.parts?.toLocaleString()} unique parts, and ${stats.minifigs?.toLocaleString()} minifigures. Search, filter, and discover LEGO building resources.`}
                />
                <meta
                    name="keywords"
                    content="LEGO catalog, LEGO sets, LEGO parts, LEGO minifigs, MOC library, BrickLink alternative, LEGO database, LEGO themes, building instructions"
                />
                <meta
                    property="og:title"
                    content="LEGO Catalog - Browse Sets, Parts & MOCs | BrickOasis"
                />
                <meta
                    property="og:description"
                    content={`Comprehensive LEGO catalog with ${stats.sets?.toLocaleString()} sets, ${stats.parts?.toLocaleString()} parts, and ${stats.minifigs?.toLocaleString()} minifigures. Your complete LEGO building resource.`}
                />
                <meta property="og:type" content="website" />
                <link
                    rel="canonical"
                    href={`${window.location.origin}/catalog`}
                />
            </Head>

            <Header
                currentPage="catalog"
                onOpenAuthModal={() => setShowAuthModal(true)}
            />
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />

            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Hero Section */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        LEGO Catalog
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Explore {stats.sets?.toLocaleString()} sets,{" "}
                        {stats.parts?.toLocaleString()} parts,{" "}
                        {stats.minifigs?.toLocaleString()} minifigs and more
                    </p>
                </div>

                {/* Global Search */}
                <SearchAutocomplete
                    scope="all"
                    placeholder="Search across all sets, MOCs, parts, minifigs..."
                    className="mb-8 max-w-2xl"
                />

                {/* Navigation Tabs */}
                <CatalogNav active="discover" stats={stats} />

                {/* Quick Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-12">
                    <QuickStatLink
                        href="/catalog/sets"
                        icon="📦"
                        label="Sets"
                        count={stats.sets}
                    />
                    <QuickStatLink
                        href="/catalog/mocs"
                        icon="🔨"
                        label="MOCs"
                        count={stats.mocs}
                    />
                    <QuickStatLink
                        href="/catalog/parts"
                        icon="🧱"
                        label="Parts"
                        count={stats.parts}
                    />
                    <QuickStatLink
                        href="/catalog/minifigs"
                        icon="🧑"
                        label="Minifigs"
                        count={stats.minifigs}
                    />
                    <QuickStatLink
                        href="/catalog"
                        icon="🎨"
                        label="Colors"
                        count={stats.colors}
                    />
                    <QuickStatLink
                        href="/catalog"
                        icon="🏷️"
                        label="Themes"
                        count={stats.themes}
                    />
                </div>

                {/* Popular Themes */}
                {popularThemes.length > 0 && (
                    <Section
                        title="Popular Themes"
                        icon="🏷️"
                        viewAllHref="/catalog/themes"
                    >
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {popularThemes.map((theme) => (
                                <a
                                    key={theme.id}
                                    href={catalogThemeUrl(theme)}
                                    className="flex items-center gap-3 p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-yellow-500 transition-all group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-medium truncate group-hover:text-yellow-400 transition-colors">
                                            {theme.name}
                                        </div>
                                        <div className="text-sm text-gray-400">
                                            {theme.sets_count.toLocaleString()}{" "}
                                            sets
                                        </div>
                                    </div>
                                    <svg
                                        className="w-4 h-4 text-gray-500 group-hover:text-yellow-400 transition-colors"
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
                                </a>
                            ))}
                        </div>
                    </Section>
                )}

                {/* Popular Sets */}
                {popularSets.length > 0 && (
                    <Section
                        title="Popular Sets"
                        icon="📦"
                        viewAllHref="/catalog/sets"
                    >
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {popularSets.map((set) => (
                                <SetCard key={set.set_num} set={set as any} />
                            ))}
                        </div>
                    </Section>
                )}

                {/* Latest Sets */}
                {latestSets.length > 0 && (
                    <Section
                        title="Latest Sets"
                        icon="🆕"
                        viewAllHref="/catalog/sets?sort=year&direction=desc"
                    >
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {latestSets.map((set) => (
                                <SetCard key={set.set_num} set={set as any} />
                            ))}
                        </div>
                    </Section>
                )}

                {/* Popular MOCs */}
                {popularMocs.length > 0 && (
                    <Section
                        title="Popular MOCs"
                        icon="🔨"
                        viewAllHref="/catalog/mocs"
                    >
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {popularMocs.map((moc) => (
                                <MocCard key={moc.set_num} moc={moc} />
                            ))}
                        </div>
                    </Section>
                )}

                {/* Latest MOCs */}
                {latestMocs.length > 0 && (
                    <Section
                        title="Latest MOCs"
                        icon="🆕"
                        viewAllHref="/catalog/mocs"
                    >
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {latestMocs.map((moc) => (
                                <MocCard key={moc.set_num} moc={moc} />
                            ))}
                        </div>
                    </Section>
                )}
            </main>

            <Footer />
        </div>
    );
}

// ==================== Sub-components ====================

function QuickStatLink({
    href,
    icon,
    label,
    count,
}: {
    href: string;
    icon: string;
    label: string;
    count: number;
}) {
    return (
        <Link
            href={href}
            className="flex flex-col items-center gap-1 p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-yellow-500 hover:bg-gray-700/50 transition-all group"
        >
            <span className="text-2xl">{icon}</span>
            <span className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors">
                {count.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400">{label}</span>
        </Link>
    );
}

function Section({
    title,
    icon,
    viewAllHref,
    children,
}: {
    title: string;
    icon: string;
    viewAllHref?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>{icon}</span>
                    {title}
                </h2>
                {viewAllHref && (
                    <Link
                        href={viewAllHref}
                        className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-1"
                    >
                        View All
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
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </Link>
                )}
            </div>
            {children}
        </section>
    );
}

function MocCard({ moc }: { moc: CatalogMocItem }) {
    const imageUrl = moc.thumbnail || moc.image_url;

    return (
        <a
            href={catalogSetUrl(moc)}
            className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-yellow-500 transition-colors group block"
        >
            <div className="aspect-5/4 bg-gray-700 relative overflow-hidden">
                <img
                    src={imageUrl}
                    alt={moc.name}
                    className={`w-full h-full ${moc.thumbnail ? "object-cover" : "object-contain p-2"} group-hover:scale-105 transition-transform`}
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                    }}
                    loading="lazy"
                />
                {moc.price && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
                        ${Number(moc.price).toFixed(2)}
                    </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-2">
                    <div className="text-yellow-400 text-xs font-mono">
                        {moc.set_num}
                    </div>
                </div>
            </div>
            <div className="p-3">
                <h3
                    className="text-white text-sm font-medium truncate"
                    title={moc.name}
                >
                    {moc.name}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                    <span>{moc.num_parts} pcs</span>
                    {moc.user && (
                        <span className="truncate ml-2">
                            by {moc.user.name}
                        </span>
                    )}
                </div>
            </div>
        </a>
    );
}
