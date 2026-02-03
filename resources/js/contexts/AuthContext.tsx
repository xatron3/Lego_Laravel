import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";

export interface User {
    id: number;
    name: string;
    email: string;
    role: "normal" | "submitter" | "mod" | "admin";
    avatar: string | null;
    created_at?: string;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const response = await fetch("/api/auth/user", {
                headers: {
                    Accept: "application/json",
                },
                credentials: "same-origin",
            });

            if (response.ok) {
                const data = await response.json();
                console.log("RefreshUser response:", data);
                // Only set user if we actually received user data (not null)
                setUser(data && data.id ? data : null);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Failed to fetch user:", error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

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
        } catch (error) {
            console.error("Logout error:", error);
        }
        setUser(null);
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
