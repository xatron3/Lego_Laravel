import React, { createContext, useContext, useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import { getCsrfToken, ensureCsrfCookie } from "../api";

export interface User {
    id: number;
    name: string;
    username: string | null;
    email: string;
    role: "normal" | "submitter" | "mod" | "admin";
    avatar: string | null;
    bio: string | null;
    is_pro?: boolean;
    pro_expires_at?: string | null;
    created_at?: string;
    settings?: {
        flipping?: {
            currency_symbol?: string;
            currency_placement?: "left" | "right";
        };
        [key: string]: any;
    };
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isPro: boolean;
    login: (
        email: string,
        password: string,
        remember?: boolean,
    ) => Promise<void>;
    register: (
        name: string,
        email: string,
        password: string,
        passwordConfirmation: string,
    ) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    hasRole: (role: User["role"]) => boolean;
    isAdmin: boolean;
    isMod: boolean;
    isSubmitter: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const roleHierarchy: Record<User["role"], number> = {
    normal: 0,
    submitter: 1,
    mod: 2,
    admin: 3,
};

export function AuthProvider({
    children,
    initialUser,
}: {
    children: React.ReactNode;
    initialUser?: User | null;
}) {
    const [user, setUser] = useState<User | null>(initialUser || null);
    const [isLoading, setIsLoading] = useState(false);

    // Listen for Inertia navigation events to update user
    useEffect(() => {
        const handlePageChange = (event: any) => {
            if (event.detail?.page?.props?.auth?.user !== undefined) {
                setUser(event.detail.page.props.auth.user);
            }
        };

        document.addEventListener("inertia:success", handlePageChange);
        return () =>
            document.removeEventListener("inertia:success", handlePageChange);
    }, []);

    const refreshUser = async () => {
        // Reload the current page to get fresh auth data from server
        router.reload({ only: ["auth"] });
    };

    const login = async (email: string, password: string, remember = false) => {
        setIsLoading(true);

        try {
            // Ensure CSRF cookie is fresh before authenticating
            await ensureCsrfCookie();

            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-XSRF-TOKEN": getCsrfToken(),
                },
                credentials: "same-origin",
                body: JSON.stringify({ email, password, remember }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message || error.errors?.email?.[0] || "Login failed",
                );
            }

            const userData = await response.json();

            if (userData && userData.id) {
                setUser(userData);
                setIsLoading(false);
                // Reload Inertia props to sync server session state
                router.reload({ only: ["auth", "cart", "notifications"] });
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (error) {
            setIsLoading(false);
            throw error;
        }
    };

    const register = async (
        name: string,
        email: string,
        password: string,
        passwordConfirmation: string,
    ) => {
        setIsLoading(true);

        try {
            // Ensure CSRF cookie is fresh before authenticating
            await ensureCsrfCookie();

            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-XSRF-TOKEN": getCsrfToken(),
                },
                credentials: "same-origin",
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    password_confirmation: passwordConfirmation,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.message ||
                        error.errors?.email?.[0] ||
                        error.errors?.password?.[0] ||
                        "Registration failed",
                );
            }

            const userData = await response.json();

            if (userData && userData.id) {
                setUser(userData);
                setIsLoading(false);
                // Reload Inertia props to sync server session state
                router.reload({ only: ["auth", "cart", "notifications"] });
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (error) {
            setIsLoading(false);
            throw error;
        }
    };

    const logout = async () => {
        setIsLoading(true);

        try {
            // Await server-side session invalidation before redirecting
            const response = await fetch("/api/auth/logout", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "X-XSRF-TOKEN": getCsrfToken(),
                },
                credentials: "same-origin",
            });

            // Wait for response to ensure Set-Cookie headers are processed
            await response.json();

            // Clear user state after successful logout
            setUser(null);
            setIsLoading(false);

            // Use window.location for full page reload to ensure cookies are cleared
            // This is more reliable than Inertia navigation for logout
            window.location.href = "/";
        } catch (error) {
            console.error("Logout error:", error);
            // Even if logout fails on server, clear client state
            setUser(null);
            setIsLoading(false);
            window.location.href = "/";
        }
    };

    const hasRole = (role: User["role"]): boolean => {
        if (!user) return false;
        return roleHierarchy[user.role] >= roleHierarchy[role];
    };

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
        isPro: !!user?.is_pro,
        login,
        register,
        logout,
        refreshUser,
        hasRole,
        isAdmin: user?.role === "admin",
        isMod: hasRole("mod"),
        isSubmitter: hasRole("submitter"),
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
