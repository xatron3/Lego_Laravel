import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import Header from "../components/Header";
import AuthModal from "../components/AuthModal";
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
        router.visit("/catalog");
    };

    return (
        <div className="min-h-screen bg-gray-900">
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
                    Back to Catalog
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
        </div>
    );
}
