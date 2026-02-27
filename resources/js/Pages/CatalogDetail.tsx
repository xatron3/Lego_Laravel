import { useState, useEffect } from "react";
import { router, Head } from "@inertiajs/react";
import Header from "../components/Header";
import AuthModal from "../components/AuthModal";
import Footer from "../components/Footer";
import LoadingState from "../components/catalog/LoadingState";
import ErrorState from "../components/catalog/ErrorState";
import SetDetail from "../components/catalog/SetDetail";
import PartDetail from "../components/catalog/PartDetail";
import MinifigDetail from "../components/catalog/MinifigDetail";
import ColorDetail from "../components/catalog/ColorDetail";
import ThemeDetail from "../components/catalog/ThemeDetail";
import CategoryDetail from "../components/catalog/CategoryDetail";
import {
    api,
    CatalogSet,
    CatalogPart,
    CatalogMinifig,
    CatalogColor,
    CatalogTheme,
    CatalogCategory,
} from "../api";

type DetailType = "set" | "part" | "minifig" | "color" | "theme" | "category";

interface Props {
    type: DetailType;
    id: string;
}

/**
 * Main page component for displaying details of catalog items (sets, parts, minifigs, etc.)
 * Follows SRP by delegating rendering to specialized detail components
 */
export default function CatalogDetail({ type, id }: Props) {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Data states for each type
    const [set, setSet] = useState<CatalogSet | null>(null);
    const [part, setPart] = useState<CatalogPart | null>(null);
    const [minifig, setMinifig] = useState<CatalogMinifig | null>(null);
    const [color, setColor] = useState<CatalogColor | null>(null);
    const [theme, setTheme] = useState<CatalogTheme | null>(null);
    const [category, setCategory] = useState<CatalogCategory | null>(null);

    useEffect(() => {
        setIsLoading(true);
        setError(null);

        const fetchData = async () => {
            try {
                switch (type) {
                    case "set":
                        setSet(await api.getCatalogSet(id));
                        break;
                    case "part":
                        setPart(await api.getCatalogPart(id));
                        break;
                    case "minifig":
                        setMinifig(await api.getCatalogMinifig(id));
                        break;
                    case "color":
                        setColor(await api.getCatalogColor(Number(id)));
                        break;
                    case "theme":
                        setTheme(await api.getCatalogTheme(Number(id)));
                        break;
                    case "category":
                        setCategory(await api.getCatalogCategory(Number(id)));
                        break;
                }
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Failed to load data",
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [type, id]);

    const goBack = () => {
        // Navigate back to the appropriate category page
        const backUrls: Record<string, string> = {
            set: "/catalog/sets",
            part: "/catalog/parts",
            minifig: "/catalog/minifigs",
            color: "/catalog",
            theme: "/catalog",
            category: "/catalog/parts",
        };
        router.visit(backUrls[type] || "/catalog");
    };

    const backLabels: Record<string, string> = {
        set: "Back to Sets",
        part: "Back to Parts",
        minifig: "Back to Minifigs",
        color: "Back to Catalog",
        theme: "Back to Catalog",
        category: "Back to Parts",
    };

    // Generate SEO meta tags based on item type and loaded data
    const generateSEO = () => {
        if (isLoading || error) {
            return {
                title: "Loading... | BrickOasis LEGO Catalog",
                description:
                    "Browse our comprehensive LEGO catalog with sets, parts, minifigs, and more.",
            };
        }

        switch (type) {
            case "set":
                if (set) {
                    return {
                        title: `${set.name} (${set.set_num}) - LEGO Set ${set.year ? set.year : ""} | BrickOasis`,
                        description: `Discover the ${set.name} LEGO set (${set.set_num})${set.year ? ` from ${set.year}` : ""}. Features ${set.num_parts} pieces${set.theme ? ` in the ${set.theme.name} theme` : ""}. View parts inventory, instructions, and building details.`,
                        keywords: `LEGO ${set.set_num}, ${set.name}, LEGO set, ${set.theme?.name || "LEGO"}, ${set.num_parts} pieces, building instructions`,
                    };
                }
                break;
            case "part":
                if (part) {
                    return {
                        title: `${part.name} (${part.part_num}) - LEGO Part | BrickOasis`,
                        description: `LEGO part ${part.part_num}: ${part.name}. Browse compatible sets, available colors, and alternative parts. Essential for MOC builders and LEGO collectors.`,
                        keywords: `LEGO part ${part.part_num}, ${part.name}, LEGO piece, BrickLink, LEGO parts`,
                    };
                }
                break;
            case "minifig":
                if (minifig) {
                    return {
                        title: `${minifig.name} (${minifig.fig_num}) - LEGO Minifigure | BrickOasis`,
                        description: `LEGO minifigure ${minifig.fig_num}: ${minifig.name}. Explore appearance details, compatible sets, and parts inventory. ${minifig.num_parts ? `Includes ${minifig.num_parts} parts.` : ""} Perfect for collectors and builders.`,
                        keywords: `LEGO minifig ${minifig.fig_num}, ${minifig.name}, LEGO minifigure, collectible, BrickLink`,
                    };
                }
                break;
            case "color":
                if (color) {
                    return {
                        title: `${color.name} - LEGO Color ID ${color.id} | BrickOasis`,
                        description: `Browse all LEGO parts available in ${color.name} color (ID: ${color.id}, RGB: ${color.rgb}). ${color.is_trans ? "Transparent color." : ""} Find sets and parts featuring this color.`,
                        keywords: `LEGO color ${color.name}, LEGO ${color.id}, RGB ${color.rgb}, LEGO parts color`,
                    };
                }
                break;
            case "theme":
                if (theme) {
                    return {
                        title: `${theme.name} - LEGO Theme | BrickOasis`,
                        description: `Explore the ${theme.name} LEGO theme. Browse all sets, parts, and minifigures from this collection. Discover building instructions and MOC inspiration.`,
                        keywords: `LEGO ${theme.name}, LEGO theme, ${theme.name} sets, ${theme.name} collection`,
                    };
                }
                break;
            case "category":
                if (category) {
                    return {
                        title: `${category.name} - LEGO Part Category | BrickOasis`,
                        description: `Browse all LEGO parts in the ${category.name} category. Find compatible pieces for your builds and custom creations. Complete parts inventory with images and details.`,
                        keywords: `LEGO ${category.name}, LEGO part category, LEGO pieces, MOC building parts`,
                    };
                }
                break;
        }

        return {
            title: "LEGO Catalog | BrickOasis",
            description:
                "Browse our comprehensive LEGO catalog with sets, parts, minifigs, and more.",
        };
    };

    const seo = generateSEO();

    return (
        <div className="min-h-screen bg-gray-900">
            <Head>
                <title>{seo.title}</title>
                <meta name="description" content={seo.description} />
                {seo.keywords && (
                    <meta name="keywords" content={seo.keywords} />
                )}
                <meta property="og:title" content={seo.title} />
                <meta property="og:description" content={seo.description} />
                <meta property="og:type" content="website" />
                <link rel="canonical" href={window.location.href} />
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
                {/* Back Button */}
                <button
                    onClick={goBack}
                    className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
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
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    {backLabels[type] || "Back to Catalog"}
                </button>

                {isLoading ? (
                    <LoadingState />
                ) : error ? (
                    <ErrorState
                        message={error}
                        onRetry={() => window.location.reload()}
                    />
                ) : (
                    <>
                        {type === "set" && set && <SetDetail set={set} />}
                        {type === "part" && part && <PartDetail part={part} />}
                        {type === "minifig" && minifig && (
                            <MinifigDetail minifig={minifig} />
                        )}
                        {type === "color" && color && (
                            <ColorDetail color={color} />
                        )}
                        {type === "theme" && theme && (
                            <ThemeDetail theme={theme} />
                        )}
                        {type === "category" && category && (
                            <CategoryDetail category={category} />
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}
