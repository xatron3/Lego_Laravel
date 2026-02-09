import { Link } from "@inertiajs/react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import UserMenu from "./UserMenu";
import SearchBar from "./SearchBar";
import NotificationBell from "./NotificationBell";

interface HeaderProps {
    onOpenAuthModal?: () => void;
    fixed?: boolean;
    currentPage?:
        | "home"
        | "store"
        | "catalog"
        | "viewer"
        | "dashboard"
        | "flipping"
        | "community";
}

interface SubMenuItem {
    label: string;
    href: string;
    description?: string;
    icon?: React.ReactNode;
}

interface MenuItem {
    label: string;
    href?: string;
    page?: string;
    submenu?: SubMenuItem[];
    highlight?: boolean;
}

export default function Header({
    onOpenAuthModal,
    fixed = true,
    currentPage,
}: HeaderProps) {
    const { isAuthenticated, isLoading, isPro } = useAuth();
    const { itemCount } = useCart();
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const menuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    const menuItems: MenuItem[] = [
        {
            label: "Home",
            href: "/",
            page: "home",
        },
        {
            label: "MOCs",
            href: "/mocs",
            page: "mocs",
        },
        {
            label: "Catalog",
            href: "/catalog",
            page: "catalog",
            submenu: [
                {
                    label: "Official Sets",
                    href: "/catalog/sets",
                    description: "Browse official LEGO sets",
                    icon: (
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
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                        </svg>
                    ),
                },
                {
                    label: "MOCs",
                    href: "/catalog/mocs",
                    description: "My Own Creations",
                    icon: (
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
                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                        </svg>
                    ),
                },
                {
                    label: "Parts",
                    href: "/catalog/parts",
                    description: "Individual LEGO pieces",
                    icon: (
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
                                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                            />
                        </svg>
                    ),
                },
                {
                    label: "Minifigs",
                    href: "/catalog/minifigs",
                    description: "LEGO minifigures",
                    icon: (
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
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                        </svg>
                    ),
                },
                {
                    label: "Themes",
                    href: "/catalog/themes",
                    description: "Browse by theme",
                    icon: (
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
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                        </svg>
                    ),
                },
            ],
        },
        ...(isAuthenticated ? [] : []),
        ...(isAuthenticated
            ? [
                  {
                      label: "Community",
                      href: "/community",
                      page: "community",
                  },
              ]
            : []),
    ];

    const handleMenuEnter = (label: string) => {
        if (menuTimeoutRef.current) {
            clearTimeout(menuTimeoutRef.current);
        }
        setActiveMenu(label);
    };

    const handleMenuLeave = () => {
        menuTimeoutRef.current = setTimeout(() => {
            setActiveMenu(null);
        }, 150);
    };

    useEffect(() => {
        return () => {
            if (menuTimeoutRef.current) {
                clearTimeout(menuTimeoutRef.current);
            }
        };
    }, []);

    // Close search when clicking outside on desktop
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target as Node)
            ) {
                setIsSearchExpanded(false);
            }
        }

        function handleEscapeKey(event: KeyboardEvent) {
            if (event.key === "Escape" && isSearchExpanded) {
                setIsSearchExpanded(false);
            }
        }

        if (isSearchExpanded) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleEscapeKey);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
                document.removeEventListener("keydown", handleEscapeKey);
            };
        }
    }, [isSearchExpanded]);

    const navLinkClass = (item: MenuItem) => {
        const isActive = currentPage === item.page;
        if (item.highlight) {
            return "text-yellow-400 hover:text-yellow-300 font-semibold transition-colors flex items-center gap-1.5";
        }
        if (isActive) {
            return "text-yellow-400 font-semibold";
        }
        return "text-gray-300 hover:text-white transition-colors font-medium";
    };

    return (
        <header
            className={`${fixed ? "fixed top-0 left-0 right-0 z-50" : ""} bg-gray-900/95 backdrop-blur-md border-b border-gray-700/50 shadow-lg`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 bg-linear-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                            <svg
                                className="w-6 h-6 text-white"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-white hidden sm:block">
                            BrickOasis
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {menuItems.map((item) => (
                            <div
                                key={item.label}
                                className="relative"
                                onMouseEnter={() =>
                                    item.submenu && handleMenuEnter(item.label)
                                }
                                onMouseLeave={handleMenuLeave}
                            >
                                {item.href ? (
                                    <Link
                                        href={item.href}
                                        className={`px-4 py-2 rounded-lg ${navLinkClass(item)}`}
                                    >
                                        {item.label}
                                        {item.submenu && (
                                            <svg
                                                className="w-4 h-4 ml-1 inline-block"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        )}
                                    </Link>
                                ) : (
                                    <span
                                        className={`px-4 py-2 rounded-lg cursor-pointer ${navLinkClass(item)}`}
                                    >
                                        {item.label}
                                        {item.submenu && (
                                            <svg
                                                className="w-4 h-4 ml-1 inline-block"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        )}
                                    </span>
                                )}

                                {/* Submenu */}
                                {item.submenu && activeMenu === item.label && (
                                    <div className="absolute top-full left-0 mt-1 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden animate-slideDown z-50">
                                        {item.submenu.map((subItem, index) => (
                                            <Link
                                                key={subItem.href}
                                                href={subItem.href}
                                                className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors ${
                                                    index > 0
                                                        ? "border-t border-gray-700/50"
                                                        : ""
                                                }`}
                                            >
                                                {subItem.icon && (
                                                    <div className="text-gray-400">
                                                        {subItem.icon}
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <div className="text-white font-medium">
                                                        {subItem.label}
                                                    </div>
                                                    {subItem.description && (
                                                        <div className="text-xs text-gray-400 mt-0.5">
                                                            {
                                                                subItem.description
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                                <svg
                                                    className="w-4 h-4 text-gray-500"
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
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>

                    {/* Search Bar - Desktop */}
                    <div
                        ref={searchRef}
                        className={`hidden md:flex items-center transition-all duration-300 ease-in-out ${
                            isSearchExpanded
                                ? "flex-1 max-w-2xl mx-4"
                                : "w-auto"
                        }`}
                    >
                        {isSearchExpanded ? (
                            <div className="w-full animate-slideInRight">
                                <SearchBar autoFocus />
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsSearchExpanded(true)}
                                className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                aria-label="Open search"
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
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-3">
                        {/* Cart Icon */}
                        {isAuthenticated && (
                            <Link
                                href="/cart"
                                className="relative p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
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
                                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                                {itemCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-gray-900 text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                                        {itemCount > 9 ? "9+" : itemCount}
                                    </span>
                                )}
                            </Link>
                        )}

                        {/* Notification Bell */}
                        {isAuthenticated && <NotificationBell />}

                        {/* User Menu / Sign In */}
                        {isAuthenticated ? (
                            <UserMenu />
                        ) : isLoading ? (
                            <div className="w-20 h-10 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500"></div>
                            </div>
                        ) : (
                            <button
                                onClick={onOpenAuthModal}
                                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-all hover:shadow-lg hidden sm:block"
                            >
                                Sign In
                            </button>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() =>
                                setIsMobileMenuOpen(!isMobileMenuOpen)
                            }
                            className="lg:hidden p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                {isMobileMenuOpen ? (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                ) : (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="lg:hidden border-t border-gray-700 bg-gray-900/98 animate-slideDown">
                    {/* Mobile Search Bar */}
                    <div className="px-4 pt-3 pb-2">
                        <SearchBar placeholder="Search..." />
                    </div>

                    <div className="px-4 py-3 space-y-1 border-t border-gray-700/50">
                        {menuItems.map((item) => (
                            <div key={item.label}>
                                {item.href && !item.submenu ? (
                                    <Link
                                        href={item.href}
                                        className={`block px-4 py-2.5 rounded-lg ${navLinkClass(item)}`}
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                    >
                                        {item.label}
                                    </Link>
                                ) : (
                                    <>
                                        <div
                                            className={`px-4 py-2.5 font-medium text-gray-400 text-sm uppercase tracking-wider`}
                                        >
                                            {item.label}
                                        </div>
                                        {item.submenu?.map((subItem) => (
                                            <Link
                                                key={subItem.href}
                                                href={subItem.href}
                                                className="flex items-center gap-3 px-6 py-2.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                                onClick={() =>
                                                    setIsMobileMenuOpen(false)
                                                }
                                            >
                                                {subItem.icon && (
                                                    <div className="text-gray-500">
                                                        {subItem.icon}
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <div className="font-medium">
                                                        {subItem.label}
                                                    </div>
                                                    {subItem.description && (
                                                        <div className="text-xs text-gray-500">
                                                            {
                                                                subItem.description
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>
                                        ))}
                                    </>
                                )}
                            </div>
                        ))}
                        {!isAuthenticated && (
                            <button
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    onOpenAuthModal?.();
                                }}
                                className="w-full px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-all mt-2"
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
