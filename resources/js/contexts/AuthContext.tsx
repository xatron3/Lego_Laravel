import React, { createContext, useContext, useState, useEffect } from "react";
import { router } from "@inertiajs/react";

export interface User {
    id: number;
    name: string;
    email: string;
    role: "normal" | "submitter" | "mod" | "admin";
    avatar: string | null;
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

function getCsrfToken(): string {
    const metaToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content");
    if (metaToken) return metaToken;

    const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="));
    if (cookie) {
        return decodeURIComponent(cookie.split("=")[1]);
    }

    return "";
}

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
        // Get CSRF cookie first
        await fetch("/sanctum/csrf-cookie", {
            credentials: "same-origin",
        });

        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
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
        console.log("Login response:", userData);
        // Verify we got valid user data
        if (userData && userData.id) {
            setUser(userData);
        } else {
            throw new Error("Invalid response from server");
        }
    };

    const register = async (
        name: string,
        email: string,
        password: string,
        passwordConfirmation: string,
    ) => {
        // Get CSRF cookie first
        await fetch("/sanctum/csrf-cookie", {
            credentials: "same-origin",
        });

        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
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
        // Verify we got valid user data
        if (userData && userData.id) {
            setUser(userData);
        } else {
            throw new Error("Invalid response from server");
        }
    };

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": getCsrfToken(),
                    "X-XSRF-TOKEN": getCsrfToken(),
                },
                credentials: "same-origin",
            });
            setUser(null);
            // Redirect to home page after logout
            router.visit("/", { replace: true });
        } catch (error) {
            console.error("Logout error:", error);
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
